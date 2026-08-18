import type { Where } from 'payload';

import { useStore } from '@tanstack/react-store';
import { Store } from '@tanstack/store';

import type { CollectionSlug, CreateData, Doc, DocID, FindQuery, StoreStatus, UpdateData } from './types';

import { sdk } from '../lib/sdk';

export interface CollectionState<S extends CollectionSlug> {
  docs: Doc<S>[];
  status: StoreStatus;
  error: string | null;
  page: number;
  hasNextPage: boolean;
  totalDocs: number;
  totalPages: number;
}

const initial = <S extends CollectionSlug>(): CollectionState<S> => ({
  docs: [],
  status: 'idle',
  error: null,
  page: 1,
  hasNextPage: false,
  totalDocs: 0,
  totalPages: 0,
});

type Updater<S extends CollectionSlug> =
  | Partial<CollectionState<S>>
  | ((s: CollectionState<S>) => Partial<CollectionState<S>>);

/**
 * Factory de store reativo para UMA collection do Payload.
 *
 * Segura o estado (docs + paginação + status) num `Store` do TanStack e expõe
 * os métodos do SDK com o slug já fixado. Reutilizável para qualquer collection:
 * `createCollectionStore('posts')` dá `Post[]` tipado, `createCollectionStore('users')`
 * dá `User[]` — sem reescrever nada.
 */
export function createCollectionStore<S extends CollectionSlug>(slug: S) {
  const store = new Store<CollectionState<S>>(initial<S>());

  // Última query usada — permite `refresh()` sem repetir os argumentos.
  let lastQuery: FindQuery = {};

  const set = (updater: Updater<S>) =>
    store.setState((s) => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));

  /** Busca a lista (substitui os docs atuais). Guarda a query para o refresh. */
  async function find(query: FindQuery = {}) {
    lastQuery = query;
    set({ status: 'loading', error: null });
    try {
      const res = await sdk.find({ collection: slug, ...query });
      set({
        status: 'ready',
        docs: res.docs as unknown as Doc<S>[],
        page: res.page ?? 1,
        hasNextPage: res.hasNextPage,
        totalDocs: res.totalDocs,
        totalPages: res.totalPages,
      });
      return res;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Busca a próxima página e ANEXA aos docs (paginação infinita). */
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
      }));
      return res;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Re-executa a última query do `find`. */
  const refresh = () => find(lastQuery);

  /** Busca um doc por ID (não altera a lista). */
  const findByID = (id: DocID, opts?: { draft?: boolean; locale?: string; depth?: number }) =>
    sdk.findByID({ collection: slug, id, ...opts } as never);

  /** Cria um doc e pré-adiciona no início da lista. */
  async function create(data: CreateData<S>, opts?: { draft?: boolean; locale?: string; depth?: number }) {
    const doc = (await sdk.create({ collection: slug, data: data as never, ...opts } as never)) as unknown as Doc<S>;
    set((s) => ({ docs: [doc, ...s.docs], totalDocs: s.totalDocs + 1 }));
    return doc;
  }

  /** Atualiza um doc por ID e reflete na lista. */
  async function update(id: DocID, data: UpdateData<S>, opts?: { draft?: boolean; locale?: string; depth?: number }) {
    const doc = (await sdk.update({
      collection: slug,
      id,
      data: data as never,
      ...opts,
    } as never)) as unknown as Doc<S>;
    set((s) => ({ docs: s.docs.map((d) => ((d as { id?: DocID }).id === id ? doc : d)) }));
    return doc;
  }

  /** Remove um doc por ID e reflete na lista. */
  async function remove(id: DocID, opts?: { draft?: boolean }) {
    const doc = (await sdk.delete({ collection: slug, id, ...opts } as never)) as unknown as Doc<S>;
    set((s) => ({
      docs: s.docs.filter((d) => (d as { id?: DocID }).id !== id),
      totalDocs: Math.max(0, s.totalDocs - 1),
    }));
    return doc;
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
// O registro é `any` de propósito — o generic fica no `getCollectionStore`/`useCollection`,
// para não brigar com a variância do TypeScript no Map.
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
 * Hook React reativo para uma collection.
 *
 * @example
 * const { docs, status, find, loadMore, create, remove } = useCollection('posts');
 */
export function useCollection<S extends CollectionSlug>(slug: S) {
  const { store, ...methods } = getCollectionStore(slug);
  const state = useStore(store, (s) => s);
  return { ...state, ...methods };
}
