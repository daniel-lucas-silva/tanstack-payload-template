# Payload 3.88 — cheatsheet

> O essencial para trabalhar nesta base **sem** consultar a doc inteira do Payload.
> O `server/config.ts` é a referência viva — este arquivo resume os gotchas.

## API-only (sem admin UI)

Não há painel admin. Tudo é REST via `/api/*`. O `index.ts` monta o Payload em
`/api/*` com `handleEndpoints` e serve o frontend nas outras rotas.

## Tipos gerados

`config.ts` tem:

```ts
typescript: { outputFile: 'server/types.ts', autoGenerate: true },
```

No boot, `generateTypes` regenera `server/types.ts`. Ele **exporta as interfaces**
(`User`, `Post`…) e **aumenta o módulo `payload`** com `GeneratedTypes` — que tipa a
Local API e o SDK.

## Gotchas (v3.88)

### Slug

`type: 'slug'` **não é um field type** na 3.88. Use o helper:

```ts
import { slugField } from 'payload';
// { name: 'slug', type: 'slug', useAsSlug: 'title' }  ← NÃO existe
slugField({ useAsSlug: 'title' }); // ← isso
```

O slug gerado vira um campo `required` no tipo — `create` exige passar `slug`.

### Duas collections auth = `req.user` é união

Com `users` + `api-keys` (ambas auth), `req.user` vira `User | ApiKey`, discriminado
por `collection`. Acessar `req.user.roles` exige narrow:

```ts
const asUser = (user: PayloadRequest['user']): User | null => (user?.collection === 'users' ? user : null);
```

### Storage é plugin (não adapter)

Na 3.88 não existe o key `storage:` do config (isso é v4). O `vercelBlobStorage` entra
em `plugins: []`, junto com `mcpPlugin`.

### Jobs

- Task handler recebe `{ input, job, req, tasks, inlineTask }` e retorna
  `{ output }` ou lança (`{ state: 'failed', errorMessage }`).
- Workflow handler recebe `{ job, tasks, inlineTask }` (o `input` vem de `job.input`).
- `inlineTask(id, { task: async ({ input }) => ({ output }), input })`.

### Hooks — assinaturas que confundem

- `beforeDelete` recebe `{ id, req, collection }` — **sem** `doc` (busque com `findByID`).
- `beforeChange` recebe `{ data, operation, originalDoc?, req }` — sem `previousDoc`.
- Field hook retorna o **novo valor**; collection hook retorna `data`/`doc`.
- Operações aninhadas em hook devem passar `req` (mesma transação) e usar
  `req.context` como flag anti-loop.

### Access control

- Retorna `boolean` **ou** `Where` (restrição row-level mergeada na query).
- Field access retorna **só** `boolean` (nunca `Where`).
- `req.user` é `null` para anônimo — sempre guarde.

## Stores (resumo)

```tsx
const posts = useCollection('posts'); // { docs, status, hasNextPage, find, loadMore, refresh, create, update, remove, ... }
const settings = useGlobal('site-settings'); // { data, findGlobal, updateGlobal, ... }
const auth = useAuth(); // { user, token, login, logout, me, ... }
```

Tipagem fim-a-fim: `useCollection('orders')` **não compila** (slug inválido);
`create` exige os campos `required` do tipo gerado.
