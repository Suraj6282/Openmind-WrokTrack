import { openDB } from 'idb';

const DB_NAME = 'openmind-offline-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('leave')) {
        db.createObjectStore('leave', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    }
  });
};

export const saveOfflineAttendance = async (data) => {
  const db = await initDB();
  return await db.add('attendance', {
    ...data,
    synced: false,
    createdAt: new Date().toISOString()
  });
};

export const getOfflineAttendance = async () => {
  const db = await initDB();
  return await db.getAll('attendance');
};

export const saveToSyncQueue = async (action, data) => {
  const db = await initDB();
  return await db.add('syncQueue', {
    action,
    data,
    attempts: 0,
    createdAt: new Date().toISOString()
  });
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return await db.getAll('syncQueue');
};

export const removeFromSyncQueue = async (id) => {
  const db = await initDB();
  return await db.delete('syncQueue', id);
};

export const clearSyncedData = async () => {
  const db = await initDB();
  const tx = db.transaction(['attendance', 'syncQueue'], 'readwrite');
  await tx.objectStore('attendance').clear();
  await tx.objectStore('syncQueue').clear();
  await tx.done;
};