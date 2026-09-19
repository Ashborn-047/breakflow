export interface Shift {
  id: string;
  name: string;
  hours: string;
  startHour: number;
  endHour: number;
  maxConcurrent: number;
}

export interface Employee {
  id: string;
  name: string;
  activeShiftId?: string | null;
  dailyUsedSeconds: number;
  activeBreakStartMs?: number | null;
}

export interface BreakRecord {
  id: string | number;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftName: string;
  startMs: number;
  endMs: number;
  durationSec: number;
}

export type DatabaseMode = 'local' | 'spacetimedb';

export interface DatabaseConfig {
  mode: DatabaseMode;
  host: string;
  dbName: string;
  connected: boolean;
  latencyMs?: number;
  error?: string | null;
}

export interface BreakTrackerState {
  shifts: Shift[];
  employees: Employee[];
  breakLogs: BreakRecord[];
  day: string;
}

export const DAILY_CAP_SECONDS = 3600; // 60 minutes per person per day
export const MAX_CONCURRENT_DEFAULT = 2;

export const DEFAULT_SHIFTS: Shift[] = [
  {
    id: 's1',
    name: 'Morning shift',
    hours: '06:00 – 16:00',
    startHour: 6,
    endHour: 16,
    maxConcurrent: 2,
  },
  {
    id: 's2',
    name: 'Afternoon shift',
    hours: '14:00 – 00:00',
    startHour: 14,
    endHour: 0,
    maxConcurrent: 2,
  },
  {
    id: 's3',
    name: 'Night shift',
    hours: '22:00 – 08:00',
    startHour: 22,
    endHour: 8,
    maxConcurrent: 2,
  },
];

export const INITIAL_PLACEHOLDER_EMPLOYEES: Employee[] = [
  { id: 'emp_01', name: 'Employee 01', dailyUsedSeconds: 0 },
  { id: 'emp_02', name: 'Employee 02', dailyUsedSeconds: 0 },
  { id: 'emp_03', name: 'Employee 03', dailyUsedSeconds: 0 },
  { id: 'emp_04', name: 'Employee 04', dailyUsedSeconds: 0 },
  { id: 'emp_05', name: 'Employee 05', dailyUsedSeconds: 0 },
  { id: 'emp_06', name: 'Employee 06', dailyUsedSeconds: 0 },
  { id: 'emp_07', name: 'Employee 07', dailyUsedSeconds: 0 },
  { id: 'emp_08', name: 'Employee 08', dailyUsedSeconds: 0 },
  { id: 'emp_09', name: 'Employee 09', dailyUsedSeconds: 0 },
  { id: 'emp_10', name: 'Employee 10', dailyUsedSeconds: 0 },
  { id: 'emp_11', name: 'Employee 11', dailyUsedSeconds: 0 },
  { id: 'emp_12', name: 'Employee 12', dailyUsedSeconds: 0 },
  { id: 'emp_13', name: 'Employee 13', dailyUsedSeconds: 0 },
  { id: 'emp_14', name: 'Employee 14', dailyUsedSeconds: 0 },
  { id: 'emp_15', name: 'Employee 15', dailyUsedSeconds: 0 },
  { id: 'emp_16', name: 'Employee 16', dailyUsedSeconds: 0 },
  { id: 'emp_17', name: 'Employee 17', dailyUsedSeconds: 0 },
  { id: 'emp_18', name: 'Employee 18', dailyUsedSeconds: 0 },
  { id: 'emp_19', name: 'Employee 19', dailyUsedSeconds: 0 },
  { id: 'emp_20', name: 'Employee 20', dailyUsedSeconds: 0 },
  { id: 'emp_21', name: 'Employee 21', dailyUsedSeconds: 0 },
  { id: 'emp_22', name: 'Employee 22', dailyUsedSeconds: 0 },
  { id: 'emp_23', name: 'Employee 23', dailyUsedSeconds: 0 },
  { id: 'emp_24', name: 'Employee 24', dailyUsedSeconds: 0 },
];
