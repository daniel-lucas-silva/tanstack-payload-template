import { useStore } from '@tanstack/react-store';
import { Store } from '@tanstack/store';
import { useEffect } from 'react';

import type { DocID, GlobalData, GlobalSlug, LocaleOrAll, StoreStatus } from './types';

import { sdk } from '../lib/sdk';
import { offlineDB } from '../sync/db';

export interface GlobalState<S extends GlobalSlug> {
  data: GlobalData<S> | null;
  status: StoreStatus;
  error: string | null;
  isFromCache?: boolean;
}

const initial = <S extends GlobalSlug>(): GlobalState<S> => ({
  data: null,
  status: 'idle',
  error: null,
  isFromCache: false,
});

type Updater<S extends GlobalSlug> = Partial<GlobalState<S>> | ((s: GlobalState<S>) => Partial<GlobalState<S>>);

/** Store reativo e offline-first para UM global do Payload (`findGlobal`/`updateGlobal` + versões). */
export function createGlobalStore<S extends GlobalSlug>(slug: S) {
  const store = new Store<GlobalState<S>>(initial<S>());

  const set = (updater: Updater<S>) =>
    store.setState((s) => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));

  /** Busca o global com cache local instantâneo e revalidação em background. */
  async function findGlobal(opts?: { locale?: LocaleOrAll; depth?: number; draft?: boolean }) {
    // 1. Carrega do cache local se disponível para eliminar delay
    const cached = await offlineDB.getGlobalCache(slug as string);
    if (cached && cached.data) {
      set({ status: 'ready', data: cached.data as GlobalData<S>, isFromCache: true, error: null });
    } else {
      set({ status: 'loading', error: null });
    }

    try {
      const data = (await sdk.findGlobal({ slug, ...opts } as never)) as GlobalData<S>;
      set({ status: 'ready', data, isFromCache: false, error: null });

      // Salva no IndexedDB
      void offlineDB.setGlobalCache({
        slug: slug as string,
        data,
        updatedAt: Date.now(),
      });

      return data;
    } catch (error) {
      if (store.state.data) {
        set({ status: 'ready', isFromCache: true });
        return store.state.data;
      }
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Atualiza o global de forma OTIMISTA e reflete imediatamente no estado. */
  async function updateGlobal(data: Partial<GlobalData<S>>, opts?: { locale?: LocaleOrAll }) {
    const current = store.state.data;
    const optimisticData = { ...(current || {}), ...data } as GlobalData<S>;

    // 1. Atualização Otimista
    set({ data: optimisticData, status: 'ready' });

    // 2. Salva localmente
    void offlineDB.setGlobalCache({
      slug: slug as string,
      data: optimisticData,
      updatedAt: Date.now(),
    });

    // 3. Sincroniza com o servidor
    try {
      const updated = (await sdk.updateGlobal({ slug, data: data as never, ...opts } as never)) as GlobalData<S>;
      set({ data: updated, isFromCache: false });
      void offlineDB.setGlobalCache({
        slug: slug as string,
        data: updated,
        updatedAt: Date.now(),
      });
      return updated;
    } catch (err) {
      console.warn('Update global offline/delayed sync:', err);
      return optimisticData;
    }
  }

  const findGlobalVersions = (where?: Record<string, unknown>) => sdk.findGlobalVersions({ slug, where } as never);
  const findGlobalVersionByID = (id: DocID) => sdk.findGlobalVersionByID({ slug, id });
  const restoreGlobalVersion = (id: DocID) => sdk.restoreGlobalVersion({ slug, id });

  return { store, findGlobal, updateGlobal, findGlobalVersions, findGlobalVersionByID, restoreGlobalVersion };
}

// Singleton por slug (registro `any` — o generic fica no `getGlobalStore`).
const registry = new Map<string, any>();

export function getGlobalStore<S extends GlobalSlug>(slug: S) {
  let entry = registry.get(slug as string);
  if (!entry) {
    entry = createGlobalStore(slug);
    registry.set(slug as string, entry);
  }
  return entry as unknown as ReturnType<typeof createGlobalStore<S>>;
}

/**
 * Hook React reativo para um global.
 *
 * @example
 * const { data, status, findGlobal, updateGlobal } = useGlobal('site-settings');
 */
export function useGlobal<S extends GlobalSlug>(slug: S) {
  const { store, ...methods } = getGlobalStore(slug);
  const state = useStore(store, (s) => s);

  // Auto-fetch no mount: busca 1x (guard status==='idle' evita re-fetch no singleton).
  useEffect(() => {
    const entry = getGlobalStore(slug);
    if (entry.store.state.status === 'idle') void entry.findGlobal();
  }, [slug]);

  return { ...state, ...methods };
}
