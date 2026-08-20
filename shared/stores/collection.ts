import type { Where } from 'payload';

import { useStore } from '@tanstack/react-store';
import { Store } from '@tanstack/store';
import { useEffect } from 'react';

import type { CollectionSlug, CreateData, Doc, DocID, FindQuery, StoreStatus, UpdateData } from './types';

import { sdk } from '../lib/sdk';
import { offlineDB } from '../sync/db';
import { syncEngine } from '../sync/engine';

export interface CollectionState<S extends CollectionSlug> {
  docs: Doc<S>[];
  status: StoreStatus;
  error: string | null;
  page: number;
  hasNextPage: boolean;
  totalDocs: number;
  totalPages: number;
  isFromCache?: boolean;
}

const initial = <S extends CollectionSlug>(): CollectionState<S> => ({
  docs: [],
  status: 'idle',
  error: null,
  page: 1,
  hasNextPage: false,
  totalDocs: 0,
  totalPages: 0,
  isFromCache: false,
});

type Updater<S extends CollectionSlug> =
  | Partial<CollectionState<S>>
  | ((s: CollectionState<S>) => Partial<CollectionState<S>>);

/**
 * Factory de store reativo e OFFLINE-FIRST para UMA collection do Payload.
 *
 * - Leitura instantânea com cache IndexedDB (Stale-While-Revalidate).
 * - Mutações otimistas imediatas (0ms de delay) para create, update e remove.
 * - Fila de sincronização persistente com reconciliação de IDs temporários.
 */
export function createCollectionStore<S extends CollectionSlug>(slug: S) {
  const store = new Store<CollectionState<S>>(initial<S>());

  // Última query usada — permite `refresh()` sem repetir os argumentos.
  let lastQuery: FindQuery = {};

  const getCacheKey = (query: FindQuery = {}) => `${slug}:${JSON.stringify(query)}`;

  const set = (updater: Updater<S>) =>
    store.setState((s) => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));

  // Salva snapshot no IndexedDB
  const persistCurrentState = async () => {
    const s = store.state;
    await offlineDB.setCollectionCache({
      key: getCacheKey(lastQuery),
      slug: slug as string,
      docs: s.docs,
      totalDocs: s.totalDocs,
      totalPages: s.totalPages,
      page: s.page,
      hasNextPage: s.hasNextPage,
      updatedAt: Date.now(),
    });
  };

  // Registra o store no SyncEngine para receber reconciliação de dados em background
  syncEngine.subscribeStore(slug as string, {
    onDocReconciled: (tempId, serverDoc) => {
      set((s) => ({
        docs: s.docs.map((d) => ((d as { id?: DocID }).id === tempId ? (serverDoc as Doc<S>) : d)),
      }));
      void persistCurrentState();
    },
    onDocUpdated: (docId, serverDoc) => {
      set((s) => ({
        docs: s.docs.map((d) => ((d as { id?: DocID }).id === docId ? (serverDoc as Doc<S>) : d)),
      }));
      void persistCurrentState();
    },
    onDocRemoved: (docId) => {
      set((s) => ({
        docs: s.docs.filter((d) => (d as { id?: DocID }).id !== docId),
        totalDocs: Math.max(0, s.totalDocs - 1),
      }));
      void persistCurrentState();
    },
  });

  /** Busca a lista com suporte a cache instantâneo e revalidação em background. */
  async function find(query: FindQuery = {}) {
    lastQuery = query;
    const cacheKey = getCacheKey(query);

    // 1. Tenta carregar imediatamente do cache local para eliminar o delay visual
    const cached = await offlineDB.getCollectionCache(cacheKey);
    if (cached && cached.docs.length > 0) {
      set({
        docs: cached.docs as unknown as Doc<S>[],
        totalDocs: cached.totalDocs,
        totalPages: cached.totalPages,
        page: cached.page,
        hasNextPage: cached.hasNextPage,
        status: 'ready',
        error: null,
        isFromCache: true,
      });
    } else {
      set({ status: 'loading', error: null });
    }

    // 2. Revalida em background com o servidor se estiver online
    try {
      const res = await sdk.find({ collection: slug, ...query });

      // Preserva docs locais otimistas que ainda não foram sincronizados
      const pendingOptimisticDocs = store.state.docs.filter((d) => (d as any)._optimistic);
      const combinedDocs = [...pendingOptimisticDocs, ...(res.docs as unknown as Doc<S>[])];

      set({
        status: 'ready',
        docs: combinedDocs,
        page: res.page ?? 1,
        hasNextPage: res.hasNextPage,
        totalDocs: res.totalDocs + pendingOptimisticDocs.length,
        totalPages: res.totalPages,
        isFromCache: false,
        error: null,
      });

      void persistCurrentState();
      return res;
    } catch (error) {
      // Se já tínhamos dados em cache, mantemos 'ready' para modo offline fluído
      if (store.state.docs.length > 0) {
        set({ status: 'ready', isFromCache: true });
        return {
          docs: store.state.docs,
          totalDocs: store.state.totalDocs,
          totalPages: store.state.totalPages,
          page: store.state.page,
          hasNextPage: store.state.hasNextPage,
        };
      }

      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Busca a próxima página e anexa aos docs existentes. */
  async function loadMore() {
    if (!store.state.hasNextPage) return;
    const nextPage = (store.state.page ?? 1) + 1;
    set({ status: 'loading', error: null });
    try {
      const res = await sdk.find({ collection: slug, ...lastQuery, page: nextPage });
      set((s) => ({
        status: 'ready',
        docs: [...s.docs, ...(res.docs as unknown as Doc<S>[])],
        page: res.page ?? nextPage,
        hasNextPage: res.hasNextPage,
        totalDocs: res.totalDocs,
        totalPages: res.totalPages,
        isFromCache: false,
      }));
      void persistCurrentState();
      return res;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Re-executa a última query do `find`. */
  const refresh = () => find(lastQuery);

  /** Busca um doc por ID. */
  const findByID = (id: DocID, opts?: { draft?: boolean; locale?: string; depth?: number }) => {
    // Procura primeiro no estado local para retorno imediato
    const local = store.state.docs.find((d) => (d as { id?: DocID }).id === id);
    if (local && !navigator.onLine) {
      return Promise.resolve(local);
    }
    return sdk.findByID({ collection: slug, id, ...opts } as never);
  };

  /**
   * Cria um doc de forma OTIMISTA (0ms de delay).
   * Insere imediatamente na UI e enfileira para sincronização em background.
   */
  async function create(data: CreateData<S>, _opts?: { draft?: boolean; locale?: string; depth?: number }) {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const optimisticDoc = {
      ...(data as any),
      id: tempId,
      createdAt: now,
      updatedAt: now,
      _optimistic: true,
    } as unknown as Doc<S>;

    // 1. Atualização Otimista Instantânea no Store
    set((s) => ({
      docs: [optimisticDoc, ...s.docs],
      totalDocs: s.totalDocs + 1,
      status: 'ready',
    }));

    // 2. Persiste no IndexedDB local
    void persistCurrentState();

    // 3. Adiciona à fila de sincronização (executa em background se online)
    await syncEngine.queueMutation({
      type: 'create',
      collection: slug as string,
      tempId,
      data,
    });

    return optimisticDoc;
  }

  /**
   * Atualiza um doc de forma OTIMISTA (0ms de delay).
   * Reflete imediatamente na UI e enfileira a mutação.
   */
  async function update(
    id: DocID,
    data: UpdateData<S>,
    _opts?: { draft?: boolean; locale?: string; depth?: number }
  ) {
    const now = new Date().toISOString();

    // 1. Atualização Otimista Instantânea no Store
    set((s) => ({
      docs: s.docs.map((d) => {
        if ((d as { id?: DocID }).id === id) {
          return {
            ...d,
            ...(data as any),
            updatedAt: now,
          };
        }
        return d;
      }),
    }));

    // 2. Persiste no IndexedDB
    void persistCurrentState();

    // 3. Adiciona à fila de sincronização
    await syncEngine.queueMutation({
      type: 'update',
      collection: slug as string,
      docId: id,
      data,
    });

    const updatedDoc = store.state.docs.find((d) => (d as { id?: DocID }).id === id);
    return updatedDoc as Doc<S>;
  }

  /**
   * Remove um doc de forma OTIMISTA (0ms de delay).
   * Remove imediatamente da UI e enfileira a deleção.
   */
  async function remove(id: DocID, _opts?: { draft?: boolean }) {
    const existing = store.state.docs.find((d) => (d as { id?: DocID }).id === id);

    // 1. Atualização Otimista Instantânea no Store
    set((s) => ({
      docs: s.docs.filter((d) => (d as { id?: DocID }).id !== id),
      totalDocs: Math.max(0, s.totalDocs - 1),
    }));

    // 2. Persiste no IndexedDB
    void persistCurrentState();

    // 3. Adiciona à fila de sincronização
    await syncEngine.queueMutation({
      type: 'delete',
      collection: slug as string,
      docId: id,
    });

    return existing as Doc<S>;
  }

  const count = (where?: Where) => sdk.count({ collection: slug, where });

  const findVersions = (where?: Where) => sdk.findVersions({ collection: slug, where });
  const findVersionByID = (id: DocID) => sdk.findVersionByID({ collection: slug, id });
  const restoreVersion = (id: DocID) => sdk.restoreVersion({ collection: slug, id });

  return {
    store,
    find,
    loadMore,
    refresh,
    findByID,
    create,
    update,
    remove,
    count,
    findVersions,
    findVersionByID,
    restoreVersion,
  };
}

// Singleton por slug: todos os componentes com o mesmo slug compartilham estado.
const registry = new Map<string, any>();

/** Retorna (ou cria) o store de uma collection. Mesma instância por slug. */
export function getCollectionStore<S extends CollectionSlug>(slug: S) {
  let entry = registry.get(slug as string);
  if (!entry) {
    entry = createCollectionStore(slug);
    registry.set(slug as string, entry);
  }
  return entry as unknown as ReturnType<typeof createCollectionStore<S>>;
}

/**
 * Hook React reativo e offline-first para uma collection.
 *
 * @example
 * const { docs, status, find, loadMore, create, remove } = useCollection('posts');
 */
export function useCollection<S extends CollectionSlug>(slug: S) {
  const { store, ...methods } = getCollectionStore(slug);
  const state = useStore(store, (s) => s);

  // Auto-fetch no mount: busca 1x (guard status==='idle' evita re-fetch no singleton).
  useEffect(() => {
    const entry = getCollectionStore(slug);
    if (entry.store.state.status === 'idle') void entry.find();
  }, [slug]);

  return { ...state, ...methods };
}
