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
  { id: 'emp_01', name: 'Abhay Mishra', dailyUsedSeconds: 0 },
  { id: 'emp_02', name: 'Abhijit Bhattacharjee', dailyUsedSeconds: 0 },
  { id: 'emp_03', name: 'Anik Saha', dailyUsedSeconds: 0 },
  { id: 'emp_04', name: 'Anirban Dutta', dailyUsedSeconds: 0 },
  { id: 'emp_05', name: 'Anoushka Mahesh Kachewar', dailyUsedSeconds: 0 },
  { id: 'emp_06', name: 'Arka Mallick', dailyUsedSeconds: 0 },
  { id: 'emp_07', name: 'Arpita Karmakar', dailyUsedSeconds: 0 },
  { id: 'emp_08', name: 'Binayak Sarkar', dailyUsedSeconds: 0 },
  { id: 'emp_09', name: 'Biprojit Paul', dailyUsedSeconds: 0 },
  { id: 'emp_10', name: 'Bishal Sarkar', dailyUsedSeconds: 0 },
  { id: 'emp_11', name: 'Biswajit Ghosh', dailyUsedSeconds: 0 },
  { id: 'emp_12', name: 'Biswajit Paul', dailyUsedSeconds: 0 },
  { id: 'emp_13', name: 'Deep Mukherjee', dailyUsedSeconds: 0 },
  { id: 'emp_14', name: 'Lilima Gandha', dailyUsedSeconds: 0 },
  { id: 'emp_15', name: 'Palash Aich', dailyUsedSeconds: 0 },
  { id: 'emp_16', name: 'Priyanka Panda', dailyUsedSeconds: 0 },
  { id: 'emp_17', name: 'Rajdeep Ray', dailyUsedSeconds: 0 },
  { id: 'emp_18', name: 'Riya Shaw', dailyUsedSeconds: 0 },
  { id: 'emp_19', name: 'Rudra Bhattacharyya', dailyUsedSeconds: 0 },
  { id: 'emp_20', name: 'Siya Shyamal', dailyUsedSeconds: 0 },
  { id: 'emp_21', name: 'Sourav Adak', dailyUsedSeconds: 0 },
  { id: 'emp_22', name: 'Sudesh Shaw', dailyUsedSeconds: 0 },
  { id: 'emp_23', name: 'Swatilekha Dutta', dailyUsedSeconds: 0 },
  { id: 'emp_24', name: 'Vedika Vivek Bhosle', dailyUsedSeconds: 0 },
];

