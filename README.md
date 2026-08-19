# Fullstack Payload Template

Starter fullstack **Bun + Payload 3.88 (API pura) + TanStack** — desenhado para ser usado
como **molde em vários projetos**: uma IA (Google Studio, Lovable) lê o código, entende o
fluxo e **imita o padrão** em vez de reinventar.

## Stack

- **Servidor** — `Bun.serve` + Payload 3.88 (`API-only`, sem admin UI)
- **Banco** — MongoDB (`@payloadcms/db-mongodb`)
- **Frontend** — TanStack Router (file-based) + Query + Store
- **Dados** — `@payloadcms/sdk` (única porta de acesso à API) + stores reativos próprios

## Quickstart

```sh
bun install
cp .env.example .env    # ajuste MONGODB_URI / PAYLOAD_SECRET
bun dev                 # http://localhost:3333
```

No boot, o config **regenera `server/types.ts`** (tipos do Payload) e semeia o primeiro
admin (via `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env`).

## Como funciona (o fluxo de dados)

Tudo gira em torno de **uma cadeia de tipos**. Não há nada mágico:

```
server/config.ts  ──(monta as peças abaixo)──▶  Payload
     │  collections/  globals/  access/  jobs/  endpoints/
     │
     └─(generateTypes no boot)─▶ server/types.ts   (Config)
                                        │
                                        ▼
shared/lib/sdk.ts   PayloadSDK<Config>  (a ÚNICA porta de acesso à API)
                                        │
                                        ▼
shared/stores/      useCollection / useGlobal / useAuth  (estado reativo, tipado)
                                        │
                                        ▼
app/routes/         páginas React (TanStack Router file-based)
```

1. Você define o schema em `server/` (collections, globals, access, jobs, endpoints).
2. O Payload gera `server/types.ts` — a **fonte única de verdade da tipagem**.
3. O frontend só fala com a API via `sdk` + stores (nunca `fetch` direto), herdando os tipos.
4. Uma rota `app/routes/...` usa `useCollection('posts')` e já recebe `Post[]` tipado.

## Estrutura

```
server/
  config.ts            Ponto de MONTAGEM — importa as peças e chama buildConfig
  access/index.ts      access control reutilizável (isUser, admins, selfOrAdmin, ...)
  collections/         users · api-keys · media · categories · posts · tags · comments · field-showcase
  globals/             site-settings · navigation
  endpoints/index.ts   endpoints raiz (health, stats, echo, kv)
  jobs/index.ts        tasks + workflows (echoTask, publishWorkflow, ...)
  types.ts             GERADO — nunca edite

shared/
  lib/sdk.ts           instância do PayloadSDK<Config>
  stores/              useCollection / useGlobal / useAuth (+ types.ts, index.ts)

app/
  main.tsx             RouterProvider + QueryClient
  routeTree.gen.ts     GERADO — nunca edite (rode `bun run routes:gen`)
  routes/
    __root.tsx         layout raiz (auth guard, shell)
    index.tsx          home
    posts/index.tsx    exemplo end-to-end (o "golden path")
```

## Como trabalhar (receitas)

### Adicionar uma collection

1. Crie `server/collections/<slug>.ts`:

   ```ts
   import type { CollectionConfig } from 'payload';
   import { slugField } from 'payload';
   import { admins, anyone } from '../access';

   export const Produtos: CollectionConfig = {
     slug: 'produtos',
     access: { read: anyone, create: admins, update: admins, delete: admins },
     fields: [
       { name: 'nome', type: 'text', required: true },
       slugField({ useAsSlug: 'nome' }),
       { name: 'preco', type: 'number', required: true },
     ],
   };
   ```

2. Registre no `server/config.ts`: `collections: [..., Produtos]`.
3. Rode `bun dev` → `server/types.ts` regenera e `Produto` passa a existir.

### Adicionar uma rota (frontend)

1. Crie `app/routes/produtos/index.tsx`:

   ```tsx
   import { createFileRoute } from '@tanstack/react-router';
   import { useCollection } from '@/shared/stores';

   export const Route = createFileRoute('/produtos/')({ component: ProdutosPage });

   function ProdutosPage() {
     const { docs, status, find } = useCollection('produtos'); // auto-fetch no mount
     return (
       <ul>
         {docs.map((p) => (
           <li key={p.id}>
             {p.nome} — R$ {p.preco}
           </li>
         ))}
       </ul>
     );
   }
   ```

2. Rode `bun run routes:gen` (gera `routeTree.gen.ts`).
3. Acesse `/produtos`.

### Access control

As funções ficam em `server/access/index.ts` e são reutilizadas. O padrão para **mais de
uma collection auth** é o type guard (nunca typecast):

```ts
export function isUser(user: Config['user'] | null): user is { collection: 'users' } & User {
  return user?.collection === 'users';
}

export const admins: Access = ({ req }) => {
  const user = req.user;
  if (!isUser(user)) return false;
  return user.roles?.includes('admin') ?? false;
};
```

### Globals, endpoints e jobs

- **Global** → `server/globals/<slug>.ts` (use `useGlobal(slug)` no frontend).
- **Endpoint raiz** → `server/endpoints/index.ts` (`{ path, method, handler }`).
- **Job (task/workflow)** → `server/jobs/index.ts` (agendado via `schedule`, disparado via `payload.jobs`).

## Os stores

| Hook                    | O que dá                                                                                          | Estado reativo            |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------------- |
| `useCollection('slug')` | `docs`, `find`, `loadMore`, `refresh`, `create`, `update`, `remove`, `count`, `findVersions`, ... | sim (auto-fetch no mount) |
| `useGlobal('slug')`     | `data`, `findGlobal`, `updateGlobal`, versões                                                     | sim (auto-fetch)          |
| `useAuth('users')`      | `user`, `token`, `login`, `logout`, `me`, `refreshToken`, ...                                     | sim                       |

- **Singleton por slug** — dois componentes com `useCollection('posts')` compartilham estado.
- **Tipados fim-a-fim** — `useCollection('posts')` retorna `Post[]`; `create` exige os campos obrigatórios.
- `find()` guarda a query e `refresh()`/`loadMore()` reutilizam (paginação via `hasNextPage`).

## Gotchas (leia antes de codar)

### Payload 3.88

- **`type: 'slug'` não existe** — use `slugField({ useAsSlug: 'campo' })` de `'payload'` (marca o slug como required nos tipos; auto-gera).
- **2+ collections auth** (`users`, `api-keys`) fazem `req.user` virar uma **união** (`User | ApiKey`). Nunca faça typecast — faça **narrow por `collection`** com o type guard:

  ```ts
  // server/access/index.ts
  export function isUser(user: Config['user'] | null): user is { collection: 'users' } & User {
    return user?.collection === 'users';
  }
  // uso: const user = req.user; if (!isUser(user)) return false; user.roles...
  ```

- **Typecast (`as X`) mascara erros.** O Payload é estritamente tipado — se dá erro de tipo, o tipo (ou o código) está errado. Afine até sumir, não cale com cast.
- **`afterChange` que chama `payload.update`** re-dispara o hook → loop infinito. Use o guard `context.triggerAfterChange === false`.
- **`graphQL.disable` está ligado** — a API é REST (consumida pelo SDK). Não habilite GraphQL sem necessidade.
- **Tipos gerados** — `server/types.ts` e `app/routeTree.gen.ts` são **gerados**; nunca edite. `types.ts` regenera no boot; `routeTree.gen.ts` com `bun run routes:gen`.

### Bun

- **Tailwind no dev precisa do `bunfig.toml`.** O `build.ts` (com `bun-plugin-tailwind`) só cobre o build. Para o `bun dev` processar `@import "tailwindcss"`, o `bunfig.toml` precisa de:

  ```toml
  [serve.static]
  plugins = ["bun-plugin-tailwind"]
  env = "BUN_PUBLIC_*"
  ```

- **Sem Vite/express/webpack** — o servidor é `Bun.serve` + HTML import (`index.ts`); o build é `build.ts` (Bun.build). Variáveis públicas de frontend usam o prefixo `BUN_PUBLIC_*`.
- **Sem `fetch` direto no frontend** — só `sdk` (`shared/lib/sdk.ts`) e os stores.

## Scripts

| Comando              | O que faz                                 |
| -------------------- | ----------------------------------------- |
| `bun dev`            | servidor + HMR (regenera types no boot)   |
| `bun run routes:gen` | gera `routeTree.gen.ts` (após criar rota) |
| `bun run build`      | build de produção (routes:gen + build.ts) |
| `bun run check`      | oxlint (0 erros)                          |
| `bunx tsc --noEmit`  | typecheck (0 erros)                       |
| `bun test`           | testes                                    |

## Docs

- [Arquitetura e padrões](docs/arquitetura.md)
- [Payload 3.88 — cheatsheet](docs/payload-3.md)
- [Regras do agente (Bun + Payload)](AGENTS.md)

> Planos, relatórios e decisões de trabalho também ficam em `docs/`, **numerados em
> ordem** (`docs/plan-01-<slug>.md`, `docs/report-01-<slug>.md`) para rastrear o histórico.
