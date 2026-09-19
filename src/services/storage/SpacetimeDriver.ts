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
  private connected: boolean = false;
  private pingInterval: number | null = null;
  private listeners: Set<(state: BreakTrackerState) => void> = new Set();
  private onStatusChange?: (connected: boolean, latencyMs?: number, error?: string) => void;

  // Cached state
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

    this.init();
  }

  private getHttpBaseUrl(): string {
    let clean = this.host.trim();
    if (clean.startsWith('wss://')) {
      clean = clean.replace('wss://', 'https://');
    } else if (clean.startsWith('ws://')) {
      clean = clean.replace('ws://', 'http://');
    } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const url = new URL(clean);
    return `${url.protocol}//${url.host}/v1/database/${encodeURIComponent(this.dbName)}`;
  }

  private async init() {
    await this.checkHealth();
    this.startHeartbeat();
  }

  public async checkHealth(): Promise<boolean> {
    const baseUrl = this.getHttpBaseUrl();
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'SELECT * FROM employee;',
      });

      if (res.ok) {
        const latency = Math.max(1, Math.round(performance.now() - start));
        this.connected = true;
        this.onStatusChange?.(true, latency);
        return true;
      } else {
        this.connected = false;
        this.onStatusChange?.(false, undefined, `HTTP error ${res.status}`);
        return false;
      }
    } catch (err: any) {
      this.connected = false;
      this.onStatusChange?.(false, undefined, err?.message || 'Connection failed');
      return false;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      this.checkHealth();
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async callReducer(reducerName: string, args: any[]): Promise<boolean> {
    const baseUrl = this.getHttpBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/call/${reducerName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify(args),
      });
      return res.ok;
    } catch (err) {
      console.warn(`SpacetimeDB callReducer (${reducerName}) failed:`, err);
      return false;
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
    // Cloud dispatch
    this.callReducer('start_break', [employeeId, shiftId]);

    // Optimistic local state update
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (emp) {
      emp.activeBreakStartMs = Date.now();
      emp.activeShiftId = shiftId;
      this.notify();
    }
    return { success: true };
  }

  public async endBreak(employeeId: string): Promise<{ success: boolean; error?: string }> {
    // Cloud dispatch
    this.callReducer('end_break', [employeeId]);

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
    this.callReducer('register_employee', [id, name]);

    const newEmp: Employee = { id, name: name.trim(), dailyUsedSeconds: 0 };
    this.state.employees.push(newEmp);
    this.notify();
    return newEmp;
  }

  public async removeEmployee(employeeId: string): Promise<void> {
    this.callReducer('remove_employee', [employeeId]);

    this.state.employees = this.state.employees.filter(e => e.id !== employeeId);
    this.notify();
  }

  public async resetDay(): Promise<void> {
    this.callReducer('reset_day', []);

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
    this.listeners.clear();
  }
}

