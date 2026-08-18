export { createCollectionStore, getCollectionStore, useCollection } from './collection';
export type { CollectionState } from './collection';

export { createGlobalStore, getGlobalStore, useGlobal } from './global';
export type { GlobalState } from './global';

export { createAuthStore, getAuthStore, useAuth } from './auth';
export type { AuthState } from './auth';

export type {
  AuthSlug,
  AuthUser,
  CollectionSlug,
  CreateData,
  Doc,
  DocID,
  FindQuery,
  GlobalData,
  GlobalSlug,
  Locale,
  LocaleOrAll,
  StoreStatus,
  UpdateData,
} from './types';
