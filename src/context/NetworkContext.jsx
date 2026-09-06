import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { offlineSyncService, SYNC_STATUS } from '../services/offlineSyncService.js';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const syncTimeout = useRef(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Trigger sync after connection restored
      clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        const pending = offlineSyncService.getPendingCount();
        if (pending > 0) {
          setSyncStatus(SYNC_STATUS.SYNCING);
          offlineSyncService.syncAll((progress) => {
            setSyncStatus(progress.status);
            setPendingCount(progress.total - progress.synced);
          }).then(() => {
            setSyncStatus(SYNC_STATUS.SYNC_COMPLETE);
            setPendingCount(0);
            // Clear "connection restored" message after 4s
            setTimeout(() => setWasOffline(false), 4000);
            // Clear sync complete after 3s
            setTimeout(() => setSyncStatus(null), 3000);
          }).catch(() => {
            setSyncStatus(SYNC_STATUS.SYNC_FAILED);
          });
        } else {
          setTimeout(() => setWasOffline(false), 3000);
        }
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      setSyncStatus(null);
      setPendingCount(offlineSyncService.getPendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(syncTimeout.current);
    };
  }, []);

  const saveLocally = (key, data) => {
    const result = offlineSyncService.saveLocally(key, data);
    setPendingCount(offlineSyncService.getPendingCount());
    setSyncStatus(SYNC_STATUS.SAVED_LOCALLY);
    return result;
  };

  const retrySycn = async () => {
    if (!isOnline) return;
    setSyncStatus(SYNC_STATUS.SYNCING);
    try {
      await offlineSyncService.syncAll((progress) => {
        setSyncStatus(progress.status);
      });
      setSyncStatus(SYNC_STATUS.SYNC_COMPLETE);
      setPendingCount(0);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch {
      setSyncStatus(SYNC_STATUS.SYNC_FAILED);
    }
  };

  const value = {
    isOnline,
    wasOffline,
    syncStatus,
    pendingCount,
    saveLocally,
    retrySycn,
    SYNC_STATUS,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
