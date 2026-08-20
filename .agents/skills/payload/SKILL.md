---
name: payload
description: Use when working with Payload CMS projects in this repo (server/config.ts, collections, globals, fields, hooks, access control, endpoints, jobs, Payload API via @payloadcms/sdk). This project is Payload 3.88 API-ONLY (no admin UI, no React components in the CMS, no Next.js). Use when debugging validation errors, security issues, relationship queries, transactions, hook behavior, or REST/SDK usage.
---

# Payload CMS — API-Only (este projeto)

Payload 3.88 headless CMS com arquitetura TypeScript-first. Neste projeto o
Payload roda **somente como API REST** (sem admin UI, sem Next.js, sem React
dentro do CMS). O frontend é TanStack (Router/Query/Store/Form) consumindo a
API exclusivamente via `@payloadcms/sdk` e os stores de `shared/stores/`.

## Stack (não troque)

- **Bun** (runtime + build) — sem Vite, sem express, sem Node scripts.
- **Payload 3.88 API-only** + MongoDB (mongoose).
- **TanStack** Router (file-based) + Query + Store + Form no frontend.
- Acesso à API no frontend **só** via `@payloadcms/sdk` (`shared/lib/sdk.ts`) e
  os stores de `shared/stores/` (`useCollection`/`useGlobal`/`useAuth`).
  **Nunca use `fetch` direto.**

## Estrutura do projeto

```
server/
  config.ts            → ponto de MONTAGEM (importa as peças, chama buildConfig)
  collections/         → 1 arquivo por collection (users, api-keys, media, posts…)
  globals/             → 1 arquivo por global (site-settings, navigation)
  access/index.ts      → access control reutilizável + type guard `isUser`
  jobs/                → tasks + workflows (echoTask, publishWorkflow…)
  endpoints/           → endpoints de raiz (/health, /stats…)
  types.ts             → GERADO no boot (`generateTypes`) — NUNCA edite
shared/
  lib/sdk.ts           → instância PayloadSDK<Config> (única porta de API)
  stores/              → useCollection / useGlobal / useAuth (reativos, auto-fetch)
app/
  routes/              → TanStack Router file-based
  routeTree.gen.ts     → GERADO (`bun run routes:gen`) — NUNCA edite
```

`config.ts` **não é um arquivo só**: ele só monta as peças das pastas. Ao
adicionar collection/global/job/endpoint, crie o arquivo na pasta certa e
registre no `config.ts`.

## Comandos

```sh
bun dev                      # servidor + HMR; no boot roda generateTypes e semeia o admin
bun run routes:gen           # gera app/routeTree.gen.ts (após criar app/routes/...)
bun run build                # routes:gen + build.ts (Bun build → dist/)
bunx oxlint --quiet <path>   # lint pontual do arquivo/pasta que mexeu (nunca global)
bun test                     # testes (bun:test)
```

## Quick Reference

| Task                     | Solution                                                             | Details                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Auto-generate slugs      | `slugField({ useAsSlug: 'campo' })`                                  | [FIELDS.md#slug-field-helper](reference/FIELDS.md#slug-field-helper)                                                             |
| Restrict content by user | Access control com query                                             | [ACCESS-CONTROL.md#row-level-security-with-complex-queries](reference/ACCESS-CONTROL.md#row-level-security-with-complex-queries) |
| Local API user ops       | `user` + `overrideAccess: false`                                     | [QUERIES.md#access-control-in-local-api](reference/QUERIES.md#access-control-in-local-api)                                       |
| Draft/publish workflow   | `versions: { drafts: true }`                                         | [COLLECTIONS.md#versioning--drafts](reference/COLLECTIONS.md#versioning--drafts)                                                 |
| Computed fields          | `virtual: true` com **hook de campo** `afterRead` retornando o valor | [FIELDS.md#virtual-fields](reference/FIELDS.md#virtual-fields)                                                                   |
| Custom field validation  | função `validate`                                                    | [FIELDS.md#validation](reference/FIELDS.md#validation)                                                                           |
| Filter relationship list | `filterOptions` no campo                                             | [FIELDS.md#relationship](reference/FIELDS.md#relationship)                                                                       |
| Select specific fields   | parâmetro `select`                                                   | [QUERIES.md#field-selection](reference/QUERIES.md#field-selection)                                                               |
| Auto-set author/dates    | hook `beforeChange`                                                  | [HOOKS.md#collection-hooks](reference/HOOKS.md#collection-hooks)                                                                 |
| Prevent hook loops       | guard `context.triggerAfterChange === false`                         | [HOOKS.md#context](reference/HOOKS.md#context)                                                                                   |
| Cascading deletes        | hook `beforeDelete`                                                  | [HOOKS.md#collection-hooks](reference/HOOKS.md#collection-hooks)                                                                 |
| Geospatial queries       | campo `point` com `near`/`within`                                    | [FIELDS.md#point-geolocation](reference/FIELDS.md#point-geolocation)                                                             |
| Reverse relationships    | tipo de campo `join`                                                 | [FIELDS.md#join-fields](reference/FIELDS.md#join-fields)                                                                         |
| Query by relationship    | sintaxe de propriedade aninhada                                      | [QUERIES.md#nested-properties](reference/QUERIES.md#nested-properties)                                                           |
| Complex queries          | lógica AND/OR                                                        | [QUERIES.md#andor-logic](reference/QUERIES.md#andor-logic)                                                                       |
| Transactions             | passar `req` nas operações                                           | [ADAPTERS.md#threading-req-through-operations](reference/ADAPTERS.md#threading-req-through-operations)                           |
| Background jobs          | fila de jobs com tasks                                               | [ADVANCED.md#jobs-queue](reference/ADVANCED.md#jobs-queue)                                                                       |
| Custom API routes        | endpoints custom de collection e de raiz                             | [ADVANCED.md#custom-endpoints](reference/ADVANCED.md#custom-endpoints)                                                           |
| Cloud storage            | plugins de storage adapter                                           | [ADAPTERS.md#storage-adapters](reference/ADAPTERS.md#storage-adapters)                                                           |
| Multi-language           | config `localization` + `localized: true`                            | [ADVANCED.md#localization](reference/ADVANCED.md#localization)                                                                   |
| Check field type         | funções type guard                                                   | [FIELD-TYPE-GUARDS.md](reference/FIELD-TYPE-GUARDS.md)                                                                           |

## Config (mínimo, API-only)

```ts
import { buildConfig } from 'payload';
import { mongooseAdapter } from '@payloadcms/db-mongodb';

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.SERVER_URL ?? 'http://localhost:3333',
  graphQL: { disable: true }, // API é REST — consumida pelo SDK
  db: mongooseAdapter({ url: process.env.MONGODB_URI }),
  collections: [Users, ApiKeys, Media, Categories, Posts, Tags, Comments, FieldShowcase],
  globals: [SiteSettings, Navigation],
  endpoints: rootEndpoints,
  jobs: { tasks, workflows },
});
```

> **Sem `admin` block, sem `editor`, sem `typescript.outputFile`.** O `config.ts`
> do projeto monta isso importando as peças de `server/`. Nenhum `admin: {...}` —
> este projeto não tem painel.

## Essential Patterns

### Collection básica

```ts
import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: { read: () => true },
  hooks: { ... },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }), // NÃO existe type: 'slug'
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'status', type: 'select', options: ['draft', 'published'], defaultValue: 'draft' },
  ],
  timestamps: true,
}
```

### Access Control com Type Safety (narrow por collection)

Há **duas collections auth** (`users` e `api-keys`) → `req.user` vira união
`User | ApiKey`. **Sempre** faça narrow por `collection` com o type guard
`isUser` de `server/access/index.ts` — **nunca typecast**:

```ts
import type { Access } from 'payload';
import { isUser } from '../access';

export const adminOnly: Access = ({ req }) => {
  if (!isUser(req.user)) return false;
  return req.user.roles?.includes('admin') || false;
};

export const ownPostsOnly: Access = ({ req }) => {
  if (!req.user) return false;
  if (isUser(req.user) && req.user.roles?.includes('admin')) return true;
  return { author: { equals: req.user.id } };
};
```

### Hooks (evitando loop)

`afterChange` que chama `req.payload.update` re-dispara o hook → loop. Use o
guard de contexto:

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.triggerAfterChange === false) return doc;
        await req.payload.update({
          collection: 'posts',
          id: doc.id,
          data: { views: (doc.views ?? 0) + 1 },
          context: { triggerAfterChange: false },
          req,
        });
      },
    ],
  },
};
```

**Hooks de coleção** recebem `{ doc, data, req, operation, ... }` e agem no
documento inteiro. **Hooks de campo** vivem no `hooks` do campo, recebem
`{ value, siblingData, ... }` e **retornam o novo valor** daquele campo
(campos virtuais usam isso).

### Query (Local API)

```ts
const posts = await req.payload.find({
  collection: 'posts',
  where: { 'status': { equals: 'published' }, 'author.name': { contains: 'john' } },
  depth: 2, // popula relacionamentos (default é 2)
  limit: 10,
  sort: '-createdAt',
  overrideAccess: false, // quando opera em nome de um usuário
});
```

## Segurança — Armadilhas

### 1. Local API ignora access control por padrão (CRÍTICO)

**Por padrão, a Local API BYPASSA todo access control**, mesmo passando user.

```ts
// ❌ BUG: passa user mas ignora as permissões dele
await payload.find({ collection: 'posts', user: someUser });

// ✅ Correto: aplica as permissões do user
await payload.find({ collection: 'posts', user: someUser, overrideAccess: false });
```

- `overrideAccess: true` (default) — operações de servidor que você confia (cron, jobs).
- `overrideAccess: false` — operações em nome de um usuário (endpoints, webhooks).

### 2. Transações quebram em hooks

Operações aninhadas no hook **sem `req`** rodam em transação separada:

```ts
// ❌ Risco de corrupção — transação separada
afterChange: [
  async ({ doc, req }) => {
    await req.payload.create({ collection: 'audit-log', data: { docId: doc.id } });
  },
];

// ✅ Atômico — mesma transação
afterChange: [
  async ({ doc, req }) => {
    await req.payload.create({ collection: 'audit-log', data: { docId: doc.id }, req });
  },
];
```

### 3. Loops infinitos de hooks

Veja o padrão de guard de contexto na seção de Hooks acima.

## Common Gotchas (deste projeto)

1. **Local API ignora access control** — passe `overrideAccess: false` ao operar por um user.
2. **`req.user` é união `User | ApiKey`** — narrow com `isUser` (type guard), nunca typecast.
3. **Loop de hooks** — operações em hooks re-disparam os hooks; use `context.triggerAfterChange === false`.
4. **`type: 'slug'` não existe** — use `slugField({ useAsSlug: 'campo' })`.
5. **Sem admin UI** — nada de `admin: {...}`, `useAsTitle`, `defaultColumns`, components.
6. **GraphQL desligado** — API é REST (`graphQL: { disable: true }`).
7. **`server/types.ts` é gerado** — regenera no boot do `bun dev`; nunca edite.
8. **Frontend nunca usa `fetch` direto** — só `@payloadcms/sdk` + stores.
9. **MongoDB transactions** exigem replica set configurado.
10. **Tipos stale** — rode `bun dev` (ou `generateTypes`) após mudar o schema.

## Best Practices

### Segurança

- Access restritivo por padrão; libere gradualmente.
- `overrideAccess: false` ao passar `user` na Local API.
- Access de campo retorna só booleano (sem query constraint).
- `saveToJWT: true` para roles, evitando lookup no banco.
- Nunca confie em dados vindos do cliente.

### Performance

- Indexe campos consultados com frequência.
- Use `select` para limitar campos retornados.
- `maxDepth` nas relationships para evitar over-fetch.
- Prefira query constraints a operações async no access control.

### Integridade

- Sempre passe `req` em operações aninhadas de hooks.
- Use flags de contexto para evitar loops de hook.
- Transações MongoDB exigem replica set.
- `beforeValidate` para formatação; `beforeChange` para lógica de negócio.

### Type Safety

- O boot roda `generateTypes` — types em `server/types.ts` ficam atualizados.
- Anote constantes extraídas com o tipo Payload correspondente
  (`CollectionConfig`, `Field`, `Access`, ...) ou use `satisfies <Type>` — sem
  anotação, strings como `type: 'text'` alargam para `string` e as uniões
  discriminadas (`Field`, `CollectionConfig`) falham.

## Reference Documentation

- **[FIELDS.md](reference/FIELDS.md)** — Todos os tipos de campo, validação
- **[FIELD-TYPE-GUARDS.md](reference/FIELD-TYPE-GUARDS.md)** — Type guards para narrowing de campos em runtime
- **[COLLECTIONS.md](reference/COLLECTIONS.md)** — Config de collection, auth, upload, drafts
- **[HOOKS.md](reference/HOOKS.md)** — Hooks de coleção e de campo, padrões de contexto
- **[ACCESS-CONTROL.md](reference/ACCESS-CONTROL.md)** — Access de coleção, campo, global, RBAC, multi-tenant
- **[ACCESS-CONTROL-ADVANCED.md](reference/ACCESS-CONTROL-ADVANCED.md)** — Access por contexto/tempo/subscrição, factory functions
- **[QUERIES.md](reference/QUERIES.md)** — Operadores de query, Local/REST API
- **[ENDPOINTS.md](reference/ENDPOINTS.md)** — Endpoints custom: autenticação, helpers, request/response
- **[ADAPTERS.md](reference/ADAPTERS.md)** — Adapters de banco, storage, email, transações
- **[ADVANCED.md](reference/ADVANCED.md)** — Autenticação, jobs, endpoints, plugins, localização
- **[PLUGIN-DEVELOPMENT.md](reference/PLUGIN-DEVELOPMENT.md)** — Arquitetura de plugin, monorepo, padrões

## Resources

- Docs: <https://payloadcms.com/docs>
- GitHub: <https://github.com/payloadcms/payload>
- Exemplos: <https://github.com/payloadcms/payload/tree/main/examples>
