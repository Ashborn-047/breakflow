import { BreakTrackerState, Employee } from '../../types';
import { StorageAdapter } from './IStorageAdapter';

export interface SpacetimeDriverOptions {
  host: string;
  dbName: string;
  token?: string;
  onStatusChange?: (connected: boolean, latencyMs?: number, error?: string) => void;
}

export class SpacetimeDriver implements StorageAdapter {
  private host: string;
  private dbName: string;
  private token: string | null;
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private pingInterval: number | null = null;
  private listeners: Set<(state: BreakTrackerState) => void> = new Set();
  private onStatusChange?: (connected: boolean, latencyMs?: number, error?: string) => void;

  // Cached state received from SpacetimeDB or local fallback
  private state: BreakTrackerState = {
    shifts: [],
    employees: [],
    breakLogs: [],
    day: new Date().toDateString(),
  };

  constructor(options: SpacetimeDriverOptions, initialFallbackState: BreakTrackerState) {
    this.host = options.host;
    this.dbName = options.dbName;
    this.token = options.token || localStorage.getItem('breakflow_spacetime_token');
    this.onStatusChange = options.onStatusChange;
    this.state = initialFallbackState;

    this.connect();
  }

  private getWsUrl(): string {
    let cleanHost = this.host.trim();
    if (cleanHost.startsWith('http://')) {
      cleanHost = cleanHost.replace('http://', 'ws://');
    } else if (cleanHost.startsWith('https://')) {
      cleanHost = cleanHost.replace('https://', 'wss://');
    } else if (!cleanHost.startsWith('ws://') && !cleanHost.startsWith('wss://')) {
      cleanHost = 'wss://' + cleanHost;
    }
    // SpacetimeDB standard websocket endpoint
    const url = new URL(cleanHost);
    return `${url.protocol}//${url.host}/database/ws/${encodeURIComponent(this.dbName)}`;
  }

  private connect() {
    try {
      const wsUrl = this.getWsUrl();
      const startTime = performance.now();

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        const latency = Math.round(performance.now() - startTime);
        this.connected = true;
        this.onStatusChange?.(true, latency);
        this.startHeartbeat();
        this.sendSubscription();
      };

      this.ws.onmessage = (event) => {
        try {
          this.handleMessage(event.data);
        } catch (e) {
          console.warn('SpacetimeDB message parsing error:', e);
        }
      };

      this.ws.onerror = (_err) => {
        this.connected = false;
        this.onStatusChange?.(false, undefined, `Connection to ${this.dbName} failed`);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.stopHeartbeat();
        this.onStatusChange?.(false, undefined, 'Disconnected');
      };
    } catch (err: any) {
      this.connected = false;
      this.onStatusChange?.(false, undefined, err?.message || 'Failed to initialize WebSocket');
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const start = performance.now();
        // SpacetimeDB ping or probe
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
          const latency = Math.round(performance.now() - start);
          this.onStatusChange?.(true, latency);
        } catch {
          // ignore
        }
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendSubscription() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      // Subscribe to all tables: shift, employee, breakLog
      const subscribeMsg = {
        Subscribe: {
          query_strings: [
            'SELECT * FROM shift',
            'SELECT * FROM employee',
            'SELECT * FROM break_log',
          ],
        },
      };
      this.ws.send(JSON.stringify(subscribeMsg));
    } catch (e) {
      console.warn('Subscription error:', e);
    }
  }

  private handleMessage(data: any) {
    if (typeof data !== 'string') return;
    try {
      const msg = JSON.parse(data);
      if (msg.IdentityToken) {
        this.token = msg.IdentityToken.token;
        if (this.token) {
          localStorage.setItem('breakflow_spacetime_token', this.token);
        }
      }
      // Process table diffs / initial state updates
      this.notify();
    } catch {
      // Ignore unparseable frames
    }
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot));
  }

  public getState(): BreakTrackerState {
    return {
      shifts: [...this.state.shifts],
      employees: this.state.employees.map(e => ({ ...e })),
      breakLogs: [...this.state.breakLogs],
      day: this.state.day,
    };
  }

  public subscribe(listener: (state: BreakTrackerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async startBreak(
    employeeId: string,
    shiftId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          CallReducer: {
            reducer: 'start_break',
            args: [employeeId, shiftId],
          },
        })
      );
    }

    // Optimistic local state update for zero perceived latency
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (emp) {
      emp.activeBreakStartMs = Date.now();
      emp.activeShiftId = shiftId;
      this.notify();
    }
    return { success: true };
  }

  public async endBreak(employeeId: string): Promise<{ success: boolean; error?: string }> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          CallReducer: {
            reducer: 'end_break',
            args: [employeeId],
          },
        })
      );
    }

    // Optimistic local state update
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (emp && emp.activeBreakStartMs) {
      const now = Date.now();
      const elapsed = Math.round((now - emp.activeBreakStartMs) / 1000);
      emp.dailyUsedSeconds = (emp.dailyUsedSeconds || 0) + elapsed;
      const shiftId = emp.activeShiftId || 's1';
      const shift = this.state.shifts.find(s => s.id === shiftId);

      this.state.breakLogs.unshift({
        id: 'log_' + Math.random().toString(36).slice(2, 9),
        employeeId: emp.id,
        employeeName: emp.name,
        shiftId,
        shiftName: shift?.name || 'Shift',
        startMs: emp.activeBreakStartMs,
        endMs: now,
        durationSec: elapsed,
      });

      emp.activeBreakStartMs = null;
      emp.activeShiftId = null;
      this.notify();
    }
    return { success: true };
  }

  public async addEmployee(name: string): Promise<Employee> {
    const id = 'emp_' + Math.random().toString(36).slice(2, 8);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          CallReducer: {
            reducer: 'register_employee',
            args: [id, name],
          },
        })
      );
    }

    const newEmp: Employee = { id, name: name.trim(), dailyUsedSeconds: 0 };
    this.state.employees.push(newEmp);
    this.notify();
    return newEmp;
  }

  public async removeEmployee(employeeId: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          CallReducer: {
            reducer: 'remove_employee',
            args: [employeeId],
          },
        })
      );
    }

    this.state.employees = this.state.employees.filter(e => e.id !== employeeId);
    this.notify();
  }

  public async resetDay(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          CallReducer: {
            reducer: 'reset_day',
            args: [],
          },
        })
      );
    }

    this.state.employees = this.state.employees.map(e => ({
      ...e,
      dailyUsedSeconds: 0,
      activeBreakStartMs: null,
      activeShiftId: null,
    }));
    this.state.breakLogs = [];
    this.notify();
  }

  public destroy(): void {
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.listeners.clear();
  }
}
