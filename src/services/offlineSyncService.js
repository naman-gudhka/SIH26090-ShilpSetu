/**
 * offlineSyncService.js
 * Offline data sync abstraction boundary.
 * Replace mock with: IndexedDB + Firebase sync when online
 *
 * Sync States:
 * - SAVED_LOCALLY: Data saved to device, not yet synced
 * - PENDING_SYNC: Awaiting network to sync
 * - SYNCING: Currently uploading to server
 * - SYNC_COMPLETE: Successfully synced
 * - SYNC_FAILED: Sync attempt failed
 */

export const SYNC_STATUS = {
  SAVED_LOCALLY: 'SAVED_LOCALLY',
  PENDING_SYNC: 'PENDING_SYNC',
  SYNCING: 'SYNCING',
  SYNC_COMPLETE: 'SYNC_COMPLETE',
  SYNC_FAILED: 'SYNC_FAILED',
};

const STORAGE_KEY = 'shilpsetu_offline_queue';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const offlineSyncService = {
  /**
   * Save data locally for later sync.
   * Replace with: IndexedDB write (idb-keyval or Dexie.js)
   */
  saveLocally(key, data) {
    try {
      const queue = this.getQueue();
      queue[key] = { data, savedAt: Date.now(), status: SYNC_STATUS.SAVED_LOCALLY };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      return { success: true, status: SYNC_STATUS.SAVED_LOCALLY };
    } catch {
      return { success: false, error: 'Could not save locally.' };
    }
  },

  /**
   * Get all pending items from local queue.
   */
  getQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  /**
   * Get pending item count.
   */
  getPendingCount() {
    const queue = this.getQueue();
    return Object.values(queue).filter(
      (item) => item.status !== SYNC_STATUS.SYNC_COMPLETE
    ).length;
  },

  /**
   * Sync all pending items when online.
   * Replace with: Real Firestore/Storage upload calls
   */
  async syncAll(onProgress) {
    const queue = this.getQueue();
    const keys = Object.keys(queue);
    if (keys.length === 0) return { success: true, synced: 0 };

    let synced = 0;
    for (const key of keys) {
      queue[key].status = SYNC_STATUS.SYNCING;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      onProgress?.({ status: SYNC_STATUS.SYNCING, key, synced, total: keys.length });

      await delay(1500); // Mock: Replace with real API call

      queue[key].status = SYNC_STATUS.SYNC_COMPLETE;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      synced++;
      onProgress?.({ status: SYNC_STATUS.SYNC_COMPLETE, key, synced, total: keys.length });
    }

    return { success: true, synced };
  },

  /**
   * Clear completed items from queue.
   */
  clearCompleted() {
    const queue = this.getQueue();
    const filtered = Object.fromEntries(
      Object.entries(queue).filter(([, v]) => v.status !== SYNC_STATUS.SYNC_COMPLETE)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};
