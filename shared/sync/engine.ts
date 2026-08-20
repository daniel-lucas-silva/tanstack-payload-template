/**
 * Offline-First Synchronization Engine for Payload SDK Stores
 */

import { offlineDB, type PendingMutation, type MutationType } from './db';
import { sdk } from '../lib/sdk';

export interface SyncEngineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  errors: Array<{ id: string; collection: string; error: string }>;
}

type SyncListener = (state: SyncEngineState) => void;

interface StoreSubscriber {
  onDocReconciled?: (tempId: string | number, serverDoc: any) => void;
  onDocUpdated?: (docId: string | number, serverDoc: any) => void;
  onDocRemoved?: (docId: string | number) => void;
  onServerRefreshed?: () => void;
}

class SyncEngine {
  private state: SyncEngineState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
    errors: [],
  };

  private listeners = new Set<SyncListener>();
  private subscribers = new Map<string, Set<StoreSubscriber>>();
  private syncPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState({ isOnline: true });
        void this.syncAll();
      });

      window.addEventListener('offline', () => {
        this.updateState({ isOnline: false });
      });

      // Listen to Service Worker notifications if available
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_COMPLETED') {
            void this.refreshPendingCount();
          }
        });
      }

      // Initial pending count load
      void this.refreshPendingCount();
    }
  }

  // ---------------------------------------------------------------------------
  // State & Subscriptions
  // ---------------------------------------------------------------------------
  getState(): SyncEngineState {
    return { ...this.state };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  subscribeStore(collection: string, subscriber: StoreSubscriber): () => void {
    if (!this.subscribers.has(collection)) {
      this.subscribers.set(collection, new Set());
    }
    const set = this.subscribers.get(collection)!;
    set.add(subscriber);
    return () => set.delete(subscriber);
  }

  private updateState(partial: Partial<SyncEngineState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  async refreshPendingCount(): Promise<number> {
    const mutations = await offlineDB.getMutations();
    const count = mutations.length;
    this.updateState({ pendingCount: count });
    return count;
  }

  // ---------------------------------------------------------------------------
  // Optimistic Mutation Queueing
  // ---------------------------------------------------------------------------
  async queueMutation(params: {
    type: MutationType;
    collection: string;
    tempId?: string | number;
    docId?: string | number;
    data?: any;
  }): Promise<PendingMutation> {
    const mutation: PendingMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: params.type,
      collection: params.collection,
      tempId: params.tempId,
      docId: params.docId,
      data: params.data,
      createdAt: Date.now(),
      attempts: 0,
    };

    await offlineDB.addMutation(mutation);
    await this.refreshPendingCount();

    // Trigger sync in background if online
    if (this.state.isOnline) {
      // Small delay to allow batching if multiple changes occur
      setTimeout(() => void this.syncAll(), 10);
    }

    return mutation;
  }

  // ---------------------------------------------------------------------------
  // Sync Processor
  // ---------------------------------------------------------------------------
  async syncAll(): Promise<{ success: boolean; processed: number; errors: number }> {
    if (this.syncPromise) {
      await this.syncPromise;
      return { success: true, processed: 0, errors: 0 };
    }

    this.syncPromise = (async () => {
      if (!navigator.onLine) {
        this.updateState({ isOnline: false, isSyncing: false });
        return;
      }

      this.updateState({ isSyncing: true, errors: [] });
      let processed = 0;
      let errorCount = 0;

      try {
        const mutations = await offlineDB.getMutations();
        if (mutations.length === 0) {
          this.updateState({ isSyncing: false, pendingCount: 0, lastSyncedAt: Date.now() });
          return;
        }

        for (const mut of mutations) {
          try {
            await this.processMutation(mut);
            await offlineDB.removeMutation(mut.id);
            processed++;
          } catch (err: any) {
            console.error(`Sync error on mutation ${mut.id} (${mut.collection}):`, err);
            errorCount++;
            mut.attempts += 1;
            mut.lastError = err?.message || String(err);
            await offlineDB.updateMutation(mut);

            // If it's a network error, stop the queue and wait for reconnect
            if (!navigator.onLine || err?.name === 'TypeError' || err?.message?.includes('fetch')) {
              this.updateState({ isOnline: false });
              break;
            }
          }
        }
      } finally {
        await this.refreshPendingCount();
        this.updateState({
          isSyncing: false,
          lastSyncedAt: Date.now(),
        });
      }
    })();

    try {
      await this.syncPromise;
      return { success: true, processed: 0, errors: 0 };
    } finally {
      this.syncPromise = null;
    }
  }

  private async processMutation(mut: PendingMutation): Promise<void> {
    const storeSubscribers = this.subscribers.get(mut.collection);

    switch (mut.type) {
      case 'create': {
        const result = (await sdk.create({
          collection: mut.collection as any,
          data: mut.data,
        })) as any;

        // Reconcile temporary ID with server ID
        if (mut.tempId && storeSubscribers) {
          for (const sub of storeSubscribers) {
            sub.onDocReconciled?.(mut.tempId, result);
          }
        }
        break;
      }

      case 'update': {
        const result = (await sdk.update({
          collection: mut.collection as any,
          id: mut.docId as any,
          data: mut.data,
        })) as any;

        if (storeSubscribers) {
          for (const sub of storeSubscribers) {
            sub.onDocUpdated?.(mut.docId!, result);
          }
        }
        break;
      }

      case 'delete': {
        await sdk.delete({
          collection: mut.collection as any,
          id: mut.docId as any,
        });

        if (storeSubscribers) {
          for (const sub of storeSubscribers) {
            sub.onDocRemoved?.(mut.docId!);
          }
        }
        break;
      }
    }
  }

  async clearQueue(): Promise<void> {
    await offlineDB.clearMutations();
    await this.refreshPendingCount();
  }
}

export const syncEngine = new SyncEngine();
