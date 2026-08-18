import { useStore } from '@tanstack/react-store';
import { Store } from '@tanstack/store';

import type { DocID, GlobalData, GlobalSlug, LocaleOrAll, StoreStatus } from './types';

import { sdk } from '../lib/sdk';

export interface GlobalState<S extends GlobalSlug> {
  data: GlobalData<S> | null;
  status: StoreStatus;
  error: string | null;
}

const initial = <S extends GlobalSlug>(): GlobalState<S> => ({ data: null, status: 'idle', error: null });

type Updater<S extends GlobalSlug> = Partial<GlobalState<S>> | ((s: GlobalState<S>) => Partial<GlobalState<S>>);

/** Store reativo para UM global do Payload (`findGlobal`/`updateGlobal` + versões). */
export function createGlobalStore<S extends GlobalSlug>(slug: S) {
  const store = new Store<GlobalState<S>>(initial<S>());

  const set = (updater: Updater<S>) =>
    store.setState((s) => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));

  /** Busca o global e guarda no estado. */
  async function findGlobal(opts?: { locale?: LocaleOrAll; depth?: number; draft?: boolean }) {
    set({ status: 'loading', error: null });
    try {
      const data = (await sdk.findGlobal({ slug, ...opts } as never)) as GlobalData<S>;
      set({ status: 'ready', data });
      return data;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Atualiza o global e reflete no estado. */
  async function updateGlobal(data: Partial<GlobalData<S>>, opts?: { locale?: LocaleOrAll }) {
    const updated = (await sdk.updateGlobal({ slug, data: data as never, ...opts } as never)) as GlobalData<S>;
    set({ data: updated });
    return updated;
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
  return { ...state, ...methods };
}
