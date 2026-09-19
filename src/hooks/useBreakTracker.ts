import { useEffect, useMemo, useState } from 'react';
import { storageManager } from '../services/storage';
import {
  BreakTrackerState,
  DAILY_CAP_SECONDS,
  DEFAULT_SHIFTS,
  Employee,
  Shift,
} from '../types';

export function isShiftActive(shift: Shift): boolean {
  const currentHour = new Date().getHours();
  if (shift.startHour < shift.endHour) {
    return currentHour >= shift.startHour && currentHour < shift.endHour;
  }
  // Handles night shifts spanning midnight (e.g., 22:00 to 08:00)
  return currentHour >= shift.startHour || currentHour < shift.endHour;
}

export function useBreakTracker() {
  const [state, setState] = useState<BreakTrackerState>(() => storageManager.getState());
  // Second-by-second ticker for live elapsed time updates
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const unsub = storageManager.subscribe(newState => {
      setState(newState);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(t => (t + 1) % 10000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live elapsed seconds for a person
  const getUsedSeconds = (employee: Employee): number => {
    const base = employee.dailyUsedSeconds || 0;
    if (employee.activeBreakStartMs) {
      const elapsed = Math.max(0, (Date.now() - employee.activeBreakStartMs) / 1000);
      return base + elapsed;
    }
    return base;
  };

  const getRemainingSeconds = (employee: Employee): number => {
    return Math.max(0, DAILY_CAP_SECONDS - getUsedSeconds(employee));
  };

  const getActiveBreaksInShift = (shiftId: string): Employee[] => {
    return state.employees.filter(
      emp => emp.activeShiftId === shiftId && emp.activeBreakStartMs
    );
  };

  // Find the currently active shift according to time of day
  const currentShift = useMemo(() => {
    return state.shifts.find(isShiftActive) || state.shifts[0] || DEFAULT_SHIFTS[0];
  }, [state.shifts, ticker]);

  // Aggregate metrics
  const totalOnBreak = useMemo(() => {
    return state.employees.filter(e => e.activeBreakStartMs).length;
  }, [state.employees, ticker]);

  const totalCapacity = useMemo(() => {
    return state.shifts.reduce((acc, s) => acc + s.maxConcurrent, 0);
  }, [state.shifts]);

  const totalMinutesUsed = useMemo(() => {
    const totalSec = state.employees.reduce((acc, e) => acc + getUsedSeconds(e), 0);
    return Math.round(totalSec / 60);
  }, [state.employees, ticker]);

  const totalOpenSlots = Math.max(0, totalCapacity - totalOnBreak);

  return {
    state,
    shifts: state.shifts,
    employees: state.employees,
    breakLogs: state.breakLogs,
    currentShift,
    totalOnBreak,
    totalCapacity,
    totalMinutesUsed,
    totalOpenSlots,
    getUsedSeconds,
    getRemainingSeconds,
    getActiveBreaksInShift,
    startBreak: (employeeId: string, shiftId: string) => storageManager.startBreak(employeeId, shiftId),
    endBreak: (employeeId: string) => storageManager.endBreak(employeeId),
    addEmployee: (name: string) => storageManager.addEmployee(name),
    removeEmployee: (employeeId: string) => storageManager.removeEmployee(employeeId),
    resetDay: () => storageManager.resetDay(),
  };
}
