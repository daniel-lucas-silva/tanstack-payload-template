import { useStore } from '@tanstack/react-store';
import { Store } from '@tanstack/store';
import { useEffect } from 'react';

import type { AuthSlug, AuthUser, StoreStatus } from './types';

import { sdk } from '../lib/sdk';

export interface AuthState<S extends AuthSlug> {
  user: AuthUser<S> | null;
  token: string | null;
  status: StoreStatus;
  error: string | null;
}

const initial = <S extends AuthSlug>(): AuthState<S> => ({ user: null, token: null, status: 'idle', error: null });

type Updater<S extends AuthSlug> = Partial<AuthState<S>> | ((s: AuthState<S>) => Partial<AuthState<S>>);

/**
 * Store de autenticação para UMA collection auth (default `users`).
 *
 * O transporte do token/cookie fica a cargo do SDK (`baseInit` em `sdk.ts`);
 * aqui só refletimos o resultado (`user`, `token`) no estado reativo.
 */
export function createAuthStore<S extends AuthSlug>(slug: S) {
  const store = new Store<AuthState<S>>(initial<S>());

  const set = (updater: Updater<S>) =>
    store.setState((s) => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));

  /** Login. Guarda `user` + `token` no estado. */
  async function login(data: { email: string; password: string }) {
    set({ status: 'loading', error: null });
    try {
      const result = await sdk.login({ collection: slug, data });
      set({ status: 'ready', user: result.user as AuthUser<S>, token: result.token ?? null });
      return result;
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /** Busca o usuário atual (requer sessão/cookie ou token gerenciado pelo SDK). */
  async function me(init?: RequestInit) {
    set({ status: 'loading', error: null });
    try {
      const result = await sdk.me({ collection: slug }, init);
      set({ status: 'ready', user: (result?.user as AuthUser<S>) ?? null, error: null });
      return result;
    } catch (error) {
      set({ status: 'ready', user: null, error: null });
      return null;
    }
  }

  const refreshToken = (init?: RequestInit) => sdk.refreshToken({ collection: slug }, init);

  const forgotPassword = (email: string) => sdk.forgotPassword({ collection: slug, data: { email } });

  const resetPassword = (data: { password: string; token: string }) => sdk.resetPassword({ collection: slug, data });

  const verifyEmail = (token: string) => sdk.verifyEmail({ collection: slug, token });

  /** Limpa o estado local (logout) e notifica o backend. */
  async function logout() {
    try {
      await sdk.request({ path: `/${slug}/logout`, method: 'POST' });
    } catch {
      // Ignora erro de rede no logout
    }
    set({ user: null, token: null, status: 'ready', error: null });
  }

  return { store, login, logout, me, refreshToken, forgotPassword, resetPassword, verifyEmail };
}

// Singleton por slug (registro `any` — o generic fica no `getAuthStore`).
const registry = new Map<string, any>();

export function getAuthStore<S extends AuthSlug>(slug: S = 'users' as S) {
  let entry = registry.get(slug as string);
  if (!entry) {
    entry = createAuthStore(slug);
    registry.set(slug as string, entry);
  }
  return entry as unknown as ReturnType<typeof createAuthStore<S>>;
}

/**
 * Hook React de autenticação.
 *
 * @example
 * const { user, token, login, logout, me } = useAuth('users');
 */
export function useAuth<S extends AuthSlug = 'users'>(slug?: S) {
  const { store, ...methods } = getAuthStore((slug ?? 'users') as S);
  const state = useStore(store, (s) => s);

  useEffect(() => {
    const targetSlug = (slug ?? 'users') as S;
    const entry = getAuthStore(targetSlug);
    if (entry.store.state.status === 'idle') {
      void entry.me();
    }
  }, [slug]);

  return { ...state, ...methods };
}
