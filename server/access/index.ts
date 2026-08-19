import type { Access, AuthStrategyFunction, FieldAccess, PayloadRequest, Where } from 'payload';

import type { User } from '../types';

/**
 * ACCESS CONTROL REUTILIZÁVEL
 *
 * Uma função de access pode retornar TRÊS coisas:
 *   1. `true`  — permite
 *   2. `false` — nega
 *   3. um objeto `Where` — restrição a nível de LINHA. O Payload faz MERGE
 *      dessa query na consulta, então o usuário só vê/edita os documentos que
 *      batem com a restrição. É assim que se faz multi-tenancy / "só o seu".
 *
 * Extrair em constantes reutilizáveis evita repetir a mesma lógica em cada
 * collection. Anote com o tipo `Access` (senão o TS alarga o literal).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type guard: narrow de `req.user` por collection.
//
// Quando há MAIS de uma collection auth, `req.user` é uma UNIÃO discriminada
// por `collection` ('users' | 'api-keys' | a que o MCP injeta). Para acessar
// campos que só existem em UMA delas (ex.: `roles`), faça narrow pelo literal.
// Este é o type guard OFICIAL do Payload (test suite): narrow, NUNCA cast.
// `as string`/`as User` ESCONDEM o erro — o correto é expô-lo e afinar o tipo.
// ─────────────────────────────────────────────────────────────────────────────
export function isUser(user: PayloadRequest['user']): user is User {
  return user?.collection === 'users';
}

/** Acesso público (qualquer um, inclusive anônimo). */
export const anyone: Access = () => true;

/** Só usuário autenticado (qualquer collection auth). */
export const authenticated: Access = ({ req }) => Boolean(req.user);

/** Só admin da collection `users`. */
export const admins: Access = ({ req }) => {
  const user = req.user;
  if (!isUser(user)) return false;
  return user.roles?.includes('admin') ?? false;
};

/** Row-level: admin vê TUDO; senão, só os próprios documentos. */
export const selfOrAdmin: Access = ({ req }) => {
  const user = req.user;
  if (!isUser(user)) return false;
  if (user.roles?.includes('admin')) return true;
  return { id: { equals: user.id } };
};

/** Combinador `and`: restrição composta (draft + autoria), ou admin libera tudo. */
export const authorCanEditDrafts: Access = ({ req }) => {
  const user = req.user;
  if (!isUser(user)) return false;
  if (user.roles?.includes('admin')) return true;
  const where: Where = { and: [{ status: { equals: 'draft' } }, { author: { equals: user.id } }] };
  return where;
};

/** Leitura pública vs. autenticada: anônimo só vê publicado, logado vê tudo. */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true;
  return { status: { equals: 'published' } };
};

/** Field-level access: SÓ retorna boolean (nunca Where). */
export const adminOnlyField: FieldAccess = ({ req }) => {
  const user = req.user;
  return isUser(user) && (user.roles?.includes('admin') ?? false);
};

/**
 * Estratégia de autenticação customizada: loga com um header `x-legacy-key`
 * em vez de senha. Útil para SSO, tokens de terceiros, magic links etc.
 * Roda AO LADO da estratégia local (email/senha); para SUBSTITUÍ-la, use
 * `auth.disableLocalStrategy: true`.
 */
export const legacyKeyStrategy: AuthStrategyFunction = async ({ headers, payload }) => {
  const key = headers.get('x-legacy-key');
  if (!key) return { user: null };
  const { docs } = await payload.find({ collection: 'users', where: { legacyKey: { equals: key } }, limit: 1 });
  const user = docs[0] ?? null;
  if (!user) return { user: null };
  return {
    // `_strategy` identifica qual estratégia autenticou (aparece em /me).
    user: { ...user, _strategy: 'users-legacy-key' },
    // Headers extras devolvidos na resposta HTTP.
    responseHeaders: new Headers({ 'X-Auth-Strategy': 'legacy-key' }),
  };
};
