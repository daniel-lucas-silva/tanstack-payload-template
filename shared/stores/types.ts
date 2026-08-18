import type { Sort, TypedLocale, Where } from 'payload';

import type { Config } from '@/server/types';

/**
 * Tipos compartilhados pelos stores.
 *
 * A tipagem inteira vem do `Config` gerado pelo Payload (`server/types.ts`),
 * o mesmo usado no `PayloadSDK<Config>` de `shared/lib/sdk.ts`. Assim,
 * `useCollection('posts')` já sabe que os docs são `Post`, e `create`/`update`
 * exigem os campos certos — sem declarar tipo manualmente.
 */

export type CollectionSlug = keyof Config['collections'];
export type GlobalSlug = keyof Config['globals'];
export type AuthSlug = keyof Config['auth'];

export type Doc<S extends CollectionSlug> = Config['collections'][S];
export type GlobalData<S extends GlobalSlug> = Config['globals'][S];
export type AuthUser<S extends AuthSlug> = Config['collections'][S];

export type Locale = TypedLocale<Config>;
export type LocaleOrAll = 'all' | Locale;
export type StoreStatus = 'idle' | 'loading' | 'ready' | 'error';

/** ID de documento — texto ou número (IDs customizados). */
export type DocID = string | number;

/** Parâmetros de listagem (o slug é fixado no factory, então `collection` fica de fora). */
export interface FindQuery {
  depth?: number;
  draft?: boolean;
  fallbackLocale?: false | Locale;
  limit?: number;
  locale?: LocaleOrAll;
  page?: number;
  pagination?: boolean;
  sort?: Sort;
  trash?: boolean;
  where?: Where;
}

/**
 * Dados de criação — o doc sem os campos de sistema que o Payload gera
 * (`id`, timestamps). Replica do `RequiredDataFromCollectionSlug` do SDK.
 * Ex.: `slug` continua obrigatório porque o `slugField` o marca como required
 * (mesmo comportamento de `sdk.create`).
 */
export type CreateData<S extends CollectionSlug> = Omit<Doc<S>, 'id' | 'createdAt' | 'updatedAt'>;

/** Dados de atualização — qualquer subconjunto dos campos. */
export type UpdateData<S extends CollectionSlug> = Partial<Doc<S>>;
