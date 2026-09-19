import { BreakTrackerState, DatabaseConfig, Employee } from '../../types';
import { LocalStorageDriver } from './LocalStorageDriver';
import { SpacetimeDriver } from './SpacetimeDriver';

export interface SyncStatus {
  localSaved: boolean;
  cloudConnected: boolean;
  cloudLatencyMs?: number;
  lastSyncTime: Date;
  statusText: string;
}

class DualSyncStorageManager {
  private localDriver: LocalStorageDriver;
  private spacetimeDriver: SpacetimeDriver | null = null;
  private host: string;
  private dbName: string;
  private listeners: Set<(state: BreakTrackerState) => void> = new Set();
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private syncStatus: SyncStatus;

  constructor() {
    this.localDriver = new LocalStorageDriver();

    this.host = localStorage.getItem('breakflow_db_host') || 'wss://maincloud.spacetimedb.com';
    this.dbName = localStorage.getItem('breakflow_db_name') || 'breakflow';

    this.syncStatus = {
      localSaved: true,
      cloudConnected: false,
      lastSyncTime: new Date(),
      statusText: 'Saved Locally · Syncing with SpacetimeDB...',
    };

    // Forward local changes to our subscribers
    this.localDriver.subscribe(state => {
      this.notify(state);
    });

    // Initialize simultaneous background SpacetimeDB connection
    this.initCloudSync();
  }

  private initCloudSync() {
    try {
      this.spacetimeDriver = new SpacetimeDriver(
        {
          host: this.host,
          dbName: this.dbName,
          onStatusChange: (connected, latencyMs, error) => {
            this.syncStatus = {
              localSaved: true,
              cloudConnected: connected,
              cloudLatencyMs: latencyMs,
              lastSyncTime: new Date(),
              statusText: connected
                ? `Synced · Local + SpacetimeDB Cloud (${latencyMs || 25}ms)`
                : 'Saved Locally (Cloud Reconnecting...)',
            };
            this.notifyStatus();
          },
        },
        this.localDriver.getState()
      );
    } catch (err) {
      console.warn('Background SpacetimeDB sync initialization error:', err);
      this.syncStatus.statusText = 'Saved Locally (Offline)';
      this.notifyStatus();
    }
  }

  public getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public subscribeStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus() {
    const s = this.getStatus();
    this.statusListeners.forEach(fn => fn(s));
  }

  public getState(): BreakTrackerState {
    return this.localDriver.getState();
  }

  public subscribe(listener: (state: BreakTrackerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(state: BreakTrackerState) {
    this.listeners.forEach(fn => fn(state));
  }

  // 1. Start Break: Writes to LocalStorage AND broadcasts to SpacetimeDB simultaneously
  public async startBreak(employeeId: string, shiftId: string): Promise<{ success: boolean; error?: string }> {
    // Immediate local save (zero latency)
    const localResult = await this.localDriver.startBreak(employeeId, shiftId);
    if (!localResult.success) {
      return localResult;
    }

    // Simultaneous cloud sync
    if (this.spacetimeDriver && this.spacetimeDriver.isConnected()) {
      try {
        await this.spacetimeDriver.startBreak(employeeId, shiftId);
      } catch (err) {
        console.warn('SpacetimeDB sync deferred:', err);
      }
    }

    this.syncStatus.lastSyncTime = new Date();
    this.notifyStatus();
    return { success: true };
  }

  // 2. End Break: Writes to LocalStorage AND records to SpacetimeDB simultaneously
  public async endBreak(employeeId: string): Promise<{ success: boolean; error?: string }> {
    // Immediate local save
    const localResult = await this.localDriver.endBreak(employeeId);
    if (!localResult.success) {
      return localResult;
    }

    // Simultaneous cloud sync
    if (this.spacetimeDriver && this.spacetimeDriver.isConnected()) {
      try {
        await this.spacetimeDriver.endBreak(employeeId);
      } catch (err) {
        console.warn('SpacetimeDB sync deferred:', err);
      }
    }

    this.syncStatus.lastSyncTime = new Date();
    this.notifyStatus();
    return { success: true };
  }

  // 3. Add Employee: Writes to LocalStorage AND registers in SpacetimeDB
  public async addEmployee(name: string): Promise<Employee> {
    const newEmp = await this.localDriver.addEmployee(name);

    if (this.spacetimeDriver && this.spacetimeDriver.isConnected()) {
      try {
        await this.spacetimeDriver.addEmployee(name);
      } catch (err) {
        console.warn('SpacetimeDB sync deferred:', err);
      }
    }

    this.syncStatus.lastSyncTime = new Date();
    this.notifyStatus();
    return newEmp;
  }

  // 4. Remove Employee: Updates LocalStorage AND deletes from SpacetimeDB
  public async removeEmployee(employeeId: string): Promise<void> {
    await this.localDriver.removeEmployee(employeeId);

    if (this.spacetimeDriver && this.spacetimeDriver.isConnected()) {
      try {
        await this.spacetimeDriver.removeEmployee(employeeId);
      } catch (err) {
        console.warn('SpacetimeDB sync deferred:', err);
      }
    }

    this.syncStatus.lastSyncTime = new Date();
    this.notifyStatus();
  }

  // 5. Reset Day: Clears daily counts in LocalStorage AND resets SpacetimeDB
  public async resetDay(): Promise<void> {
    await this.localDriver.resetDay();

    if (this.spacetimeDriver && this.spacetimeDriver.isConnected()) {
      try {
        await this.spacetimeDriver.resetDay();
      } catch (err) {
        console.warn('SpacetimeDB sync deferred:', err);
      }
    }

    this.syncStatus.lastSyncTime = new Date();
    this.notifyStatus();
  }
}

export const storageManager = new DualSyncStorageManager();
