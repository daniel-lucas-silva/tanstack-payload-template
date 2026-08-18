# Arquitetura e padrões

> O princípio do starter: **a IA imita o padrão**. Cada peça abaixo é o padrão a ser
> seguido — não um exemplo pontual, mas a forma canônica de fazer.

## 1. Fluxo de dados

```
server/config.ts ──(generateTypes no boot)──▶ server/types.ts
                                                     │ (Config)
                                                     ▼
                                         shared/lib/sdk.ts  (PayloadSDK<Config>)
                                                     │
                                                     ▼
                                        shared/stores/  (useCollection / useGlobal / useAuth)
                                                     │
                                                     ▼
                                        app/routes/  (páginas React)
```

Uma única fonte de verdade: o `config.ts`. Dele nascem os tipos (`server/types.ts`), e
toda a camada de dados (`sdk` + `stores`) herda a tipagem **fim-a-fim** — sem declarar
tipo manualmente.

## 2. As peças

### `server/config.ts` — o catálogo de capacidades

Um arquivo único que demonstra **tudo** o que o Payload faz, só na API (sem admin UI):

- **Access control** — helpers reutilizáveis (`anyone`, `authenticated`, `admins`,
  `selfOrAdmin`, `publishedOrAuthenticated`), row-level com `Where`, field access,
  `admin`/`unlock`/`readVersions`.
- **Hooks** — todos os tipos em `posts` + `req` threadado + `afterError` global.
- **Jobs** — 2 tasks (retries, cron) + 2 workflows (`tasks` object, `inlineTask`).
- **Endpoints** — root (`/health`, `/stats`, `/echo`, `/kv`), collection e global.
- **Auth** — `users` (lockout, verify, loginWithUsername, API key, estratégia custom)
  - `api-keys` (machine-to-machine).
- **Fields** — join, relationship polimórfica, slug, virtual, blocks/array/group/tabs,
  drafts, trash, orderable, localization + i18n.

> Não é para copiar o schema. É para **entender como se configura** cada recurso.
> Leia os comentários do arquivo — o avançado está explicado; o básico está só presente.

### `shared/lib/sdk.ts`

A instância única do SDK (`PayloadSDK<Config>`). **Toda** chamada à API passa por ela.

### `shared/stores/` — estado reativo reutilizável

Stores genéricos por entidade, com estado reativo (TanStack Store) e tipagem do `Config`:

| Hook                  | Para                   | Estado             |
| --------------------- | ---------------------- | ------------------ |
| `useCollection(slug)` | qualquer collection    | `docs` + paginação |
| `useGlobal(slug)`     | qualquer global        | `data`             |
| `useAuth(slug?)`      | auth (default `users`) | `user` + `token`   |

São **singletons por slug**: dois componentes com `useCollection('posts')` compartilham
o mesmo estado.

## 3. Como adicionar uma collection (o padrão)

1. Adicione a collection no `server/config.ts` (siga o estilo de uma existente).
2. Reinicie o `bun dev` — o `generateTypes` atualiza `server/types.ts`.
3. Use no frontend:

```tsx
const { docs, status, find, create } = useCollection('meu-slug');

// tipado: docs é MeuSlug[], create exige os campos required
await find({ where: { ativo: { equals: true } } });
```

Nada mais. A tipagem e o estado reativo vêm de graça.

## 4. API dos stores

### `useCollection(slug)`

Estado: `docs`, `status` (`idle|loading|ready|error`), `error`, `page`, `hasNextPage`,
`totalDocs`, `totalPages`.

Métodos:

| Método                                                                | O que faz                                             |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| `find(query)`                                                         | busca lista (substitui docs); guarda query p/ refresh |
| `loadMore()`                                                          | anexa a próxima página                                |
| `refresh()`                                                           | re-executa a última query                             |
| `findByID(id)`                                                        | um doc por ID                                         |
| `create(data)`                                                        | cria + pré-adiciona na lista                          |
| `update(id, data)`                                                    | atualiza + reflete na lista                           |
| `remove(id)`                                                          | deleta + reflete na lista                             |
| `count(where?)`                                                       | conta                                                 |
| `findVersions(where?)` / `findVersionByID(id)` / `restoreVersion(id)` | versões                                               |

`query` aceita: `where`, `sort`, `limit`, `page`, `locale`, `draft`, `trash`, `depth`,
`fallbackLocale`, `pagination`.

### `useGlobal(slug)`

`{ data, status, error }` + `findGlobal(opts?)`, `updateGlobal(data)`,
`findGlobalVersions()`, `findGlobalVersionByID(id)`, `restoreGlobalVersion(id)`.

### `useAuth(slug?)`

`{ user, token, status, error }` + `login({ email, password })`, `logout()`, `me()`,
`refreshToken()`, `forgotPassword(email)`, `resetPassword({ password, token })`,
`verifyEmail(token)`.

## 5. O golden path

`app/routes/posts/index.tsx` mostra as três peças juntas:

- `useGlobal('site-settings')` → dado global (siteName/tagline)
- `useCollection('posts')` → lista + paginação + create/remove reativos
- `useAuth()` → login (o `create` exige `authenticated`)

Use esse arquivo como referência de "como tudo se encaixa".
