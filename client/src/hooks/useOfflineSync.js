import { useState, useEffect } from 'react';
import { openDB } from 'idb';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOffline = async (storeName, data) => {
    try {
      const db = await openDB('offline-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        },
      });

      await db.add(storeName, {
        ...data,
        synced: false,
        createdAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to save offline:', error);
      return false;
    }
  };

  const getOfflineData = async (storeName) => {
    try {
      const db = await openDB('offline-db', 1);
      return await db.getAll(storeName);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  };

  const syncData = async (storeName, syncFunction) => {
    if (!isOnline) return;

    setSyncStatus('syncing');
    try {
      const offlineData = await getOfflineData(storeName);
      const unsynced = offlineData.filter(item => !item.synced);

      for (const item of unsynced) {
        try {
          await syncFunction(item);
          
          const db = await openDB('offline-db', 1);
          await db.put(storeName, { ...item, synced: true });
        } catch (error) {
          console.error('Failed to sync item:', error);
        }
      }

      setSyncStatus('completed');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  return {
    isOnline,
    syncStatus,
    saveOffline,
    getOfflineData,
    syncData
  };
};