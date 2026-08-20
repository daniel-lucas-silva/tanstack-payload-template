/**
 * IndexedDB Wrapper for Offline-First Payload Data & Mutation Queue
 */

const DB_NAME = 'payload_offline_db';
const DB_VERSION = 1;

export interface CachedCollectionData {
  key: string; // e.g. "posts:{}"
  slug: string;
  docs: any[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  updatedAt: number;
}

export interface CachedGlobalData {
  slug: string;
  data: any;
  updatedAt: number;
}

export type MutationType = 'create' | 'update' | 'delete';

export interface PendingMutation {
  id: string; // unique mutation id (e.g. "mut_1234567")
  type: MutationType;
  collection: string;
  tempId?: string | number; // temporary local id for created docs
  docId?: string | number; // target document id for update/delete
  data?: any;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

class OfflineDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('collections_cache')) {
            db.createObjectStore('collections_cache', { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains('globals_cache')) {
            db.createObjectStore('globals_cache', { keyPath: 'slug' });
          }

          if (!db.objectStoreNames.contains('sync_mutations')) {
            const mutationStore = db.createObjectStore('sync_mutations', { keyPath: 'id' });
            mutationStore.createIndex('collection', 'collection', { unique: false });
            mutationStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  // ---------------------------------------------------------------------------
  // Collections Cache
  // ---------------------------------------------------------------------------
  async getCollectionCache(key: string): Promise<CachedCollectionData | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('collections_cache', 'readonly');
        const store = tx.objectStore('collections_cache');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async setCollectionCache(data: CachedCollectionData): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('collections_cache', 'readwrite');
        const store = tx.objectStore('collections_cache');
        const req = store.put(data);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save collection cache to IndexedDB:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Globals Cache
  // ---------------------------------------------------------------------------
  async getGlobalCache(slug: string): Promise<CachedGlobalData | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('globals_cache', 'readonly');
        const store = tx.objectStore('globals_cache');
        const req = store.get(slug);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async setGlobalCache(data: CachedGlobalData): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('globals_cache', 'readwrite');
        const store = tx.objectStore('globals_cache');
        const req = store.put(data);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save global cache to IndexedDB:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Mutation Queue (Offline & Optimistic Sync)
  // ---------------------------------------------------------------------------
  async addMutation(mutation: PendingMutation): Promise<void> {
    if (!this.isSupported()) return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_mutations', 'readwrite');
      const store = tx.objectStore('sync_mutations');
      const req = store.put(mutation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getMutations(): Promise<PendingMutation[]> {
    if (!this.isSupported()) return [];
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('sync_mutations', 'readonly');
        const store = tx.objectStore('sync_mutations');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as PendingMutation[]) || [];
          list.sort((a, b) => a.createdAt - b.createdAt);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async updateMutation(mutation: PendingMutation): Promise<void> {
    if (!this.isSupported()) return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_mutations', 'readwrite');
      const store = tx.objectStore('sync_mutations');
      const req = store.put(mutation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async removeMutation(id: string): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_mutations', 'readwrite');
        const store = tx.objectStore('sync_mutations');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to remove mutation from IndexedDB:', err);
    }
  }

  async clearMutations(): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_mutations', 'readwrite');
        const store = tx.objectStore('sync_mutations');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to clear mutations from IndexedDB:', err);
    }
  }
}

export const offlineDB = new OfflineDB();
