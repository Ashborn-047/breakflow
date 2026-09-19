import {
  BreakTrackerState,
  DAILY_CAP_SECONDS,
  DEFAULT_SHIFTS,
  Employee,
  INITIAL_PLACEHOLDER_EMPLOYEES,
} from '../../types';
import { StorageAdapter } from './IStorageAdapter';

const STORAGE_KEY = 'breakflow_local_v5';

export class LocalStorageDriver implements StorageAdapter {
  private state: BreakTrackerState;
  private listeners: Set<(state: BreakTrackerState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.checkDayRollover();
  }

  private loadState(): BreakTrackerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        let emps = parsed.employees?.length ? parsed.employees : INITIAL_PLACEHOLDER_EMPLOYEES;
        // Auto-upgrade generic placeholder names back to real roster names
        if (emps.some((e: any) => e.name && /^Employee\s+\d+$/i.test(e.name))) {
          emps = INITIAL_PLACEHOLDER_EMPLOYEES.map(def => {
            const existing = emps.find((e: any) => e.id === def.id);
            return existing ? { ...existing, name: def.name } : def;
          });
        }
        return {
          shifts: parsed.shifts?.length ? parsed.shifts : DEFAULT_SHIFTS,
          employees: emps,
          breakLogs: parsed.breakLogs || [],
          day: parsed.day || new Date().toDateString(),
        };
      }
    } catch (e) {
      console.error('Failed to parse local state, falling back to defaults:', e);
    }

    return {
      shifts: DEFAULT_SHIFTS,
      employees: INITIAL_PLACEHOLDER_EMPLOYEES,
      breakLogs: [],
      day: new Date().toDateString(),
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist to localStorage:', e);
    }
    this.notify();
  }

  private checkDayRollover() {
    const today = new Date().toDateString();
    if (this.state.day !== today) {
      this.state.employees = this.state.employees.map(emp => ({
        ...emp,
        dailyUsedSeconds: 0,
        activeBreakStartMs: null,
        activeShiftId: null,
      }));
      this.state.day = today;
      this.saveState();
    }
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Error in subscriber callback:', err);
      }
    });
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
    return true;
  }

  public async startBreak(
    employeeId: string,
    shiftId: string
  ): Promise<{ success: boolean; error?: string }> {
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, error: 'Employee not found' };

    if (emp.activeBreakStartMs) {
      return { success: false, error: 'Employee is already on break' };
    }

    if (emp.dailyUsedSeconds >= DAILY_CAP_SECONDS) {
      return { success: false, error: 'Daily allowance of 60 minutes already used' };
    }

    const shift = this.state.shifts.find(s => s.id === shiftId);
    if (!shift) return { success: false, error: 'Shift not found' };

    // Check shift capacity limit
    const activeInShift = this.state.employees.filter(
      e => e.activeShiftId === shiftId && e.activeBreakStartMs
    ).length;

    if (activeInShift >= shift.maxConcurrent) {
      return {
        success: false,
        error: `Shift ${shift.name} break capacity is full (${activeInShift}/${shift.maxConcurrent} active)`,
      };
    }

    emp.activeBreakStartMs = Date.now();
    emp.activeShiftId = shiftId;
    this.saveState();
    return { success: true };
  }

  public async endBreak(employeeId: string): Promise<{ success: boolean; error?: string }> {
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (!emp || !emp.activeBreakStartMs) {
      return { success: false, error: 'Employee is not on break' };
    }

    const now = Date.now();
    const durationSec = Math.max(0, Math.round((now - emp.activeBreakStartMs) / 1000));
    const shiftId = emp.activeShiftId || 's1';
    const shift = this.state.shifts.find(s => s.id === shiftId);

    emp.dailyUsedSeconds = (emp.dailyUsedSeconds || 0) + durationSec;

    this.state.breakLogs.unshift({
      id: 'log_' + Math.random().toString(36).slice(2, 9),
      employeeId: emp.id,
      employeeName: emp.name,
      shiftId,
      shiftName: shift?.name || 'Shift',
      startMs: emp.activeBreakStartMs,
      endMs: now,
      durationSec,
    });

    emp.activeBreakStartMs = null;
    emp.activeShiftId = null;

    this.saveState();
    return { success: true };
  }

  public async addEmployee(name: string): Promise<Employee> {
    const id = 'emp_' + Math.random().toString(36).slice(2, 8);
    const newEmp: Employee = {
      id,
      name: name.trim(),
      dailyUsedSeconds: 0,
    };
    this.state.employees.push(newEmp);
    this.saveState();
    return newEmp;
  }

  public async removeEmployee(employeeId: string): Promise<void> {
    this.state.employees = this.state.employees.filter(e => e.id !== employeeId);
    this.saveState();
  }

  public async resetDay(): Promise<void> {
    this.state.employees = this.state.employees.map(e => ({
      ...e,
      dailyUsedSeconds: 0,
      activeBreakStartMs: null,
      activeShiftId: null,
    }));
    this.state.breakLogs = [];
    this.state.day = new Date().toDateString();
    this.saveState();
  }

  public destroy(): void {
    this.listeners.clear();
  }
}
