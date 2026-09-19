import { useEffect, useState } from 'react';
import { storageManager, SyncStatus } from '../services/storage';

export function useDatabaseStatus() {
  const [status, setStatus] = useState<SyncStatus>(() => storageManager.getStatus());

  useEffect(() => {
    return storageManager.subscribeStatus(newStatus => {
      setStatus(newStatus);
    });
  }, []);

  return {
    status,
  };
}
