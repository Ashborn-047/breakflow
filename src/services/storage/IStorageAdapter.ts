import { BreakTrackerState, Employee } from '../../types';

export interface StorageAdapter {
  getState(): BreakTrackerState;
  subscribe(listener: (state: BreakTrackerState) => void): () => void;
  startBreak(employeeId: string, shiftId: string): Promise<{ success: boolean; error?: string }>;
  endBreak(employeeId: string): Promise<{ success: boolean; error?: string }>;
  addEmployee(name: string): Promise<Employee>;
  removeEmployee(employeeId: string): Promise<void>;
  resetDay(): Promise<void>;
  isConnected(): boolean;
  destroy(): void;
}
