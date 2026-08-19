# Instruções do projeto — Fullstack Payload Template

- Usar template: https://github.com/daniel-lucas-silva/tanstack-payload-template

## Stack (não troque)

- **Bun** (servidor + build) — **sem Vite, sem express, sem Node scripts**.
- **Payload 3.88 API-only** (sem admin UI) + MongoDB.
- **TanStack** Router (file-based) + Query + Store.
- Acesso à API **só** via `@payloadcms/sdk` + stores. **Nunca `fetch` direto.**

## Estrutura (siga este padrão)

```
server/
  config.ts            → ponto de MONTAGEM (importa as peças, chama buildConfig)
  collections/         → 1 arquivo por collection
  globals/             → 1 arquivo por global
  access/index.ts      → access control reutilizável
  jobs/index.ts        → tasks + workflows
  endpoints/index.ts   → endpoints raiz
  types.ts             → GERADO — nunca edite
shared/
  lib/sdk.ts           → instância PayloadSDK<Config>
  stores/              → useCollection / useGlobal / useAuth (reativos, auto-fetch)
app/
  routes/              → TanStack Router file-based (1 arquivo por rota)
  routeTree.gen.ts     → GERADO — rode `bun run routes:gen`
layers/                → apps secundárias (ex.: kiosk, app do cliente)
```

## Fluxo de dados

```
server/ (schema) → generateTypes (boot) → server/types.ts (Config)
     → sdk (shared/lib/sdk.ts) → stores (shared/stores/) → routes (app/routes/)
```

## Regras não negociáveis

- **Nunca edite** `server/types.ts` nem `app/routeTree.gen.ts` (gerados).
- **Nunca `fetch` direto** no frontend — use `useCollection`/`useGlobal`/`useAuth`.
- **Slug**: use `slugField({ useAsSlug: 'campo' })` — `type: 'slug'` **não existe**.
- **2+ collections auth** → `req.user` vira união; faça **narrow por `collection`** com
  type guard (ex.: `isUser`), **nunca typecast**.
- **Tailwind no dev** exige `bunfig.toml` com `[serve.static] plugins = ["bun-plugin-tailwind"]`.
- **Documente** planos, relatórios e decisões em `docs/`, **numerados em ordem**
  (`docs/plan-01-<slug>.md`, `docs/report-01-<slug>.md`) — não mostre só no chat.

## Comandos

```sh
bun dev                 # servidor + HMR (regenera types no boot)
bun run routes:gen      # após criar app/routes/...
bun run build           # build de produção
bunx tsc --noEmit       # typecheck
bun run check           # oxlint
```

## Depois de codar (obrigatório)

- `bunx tsc --noEmit` = **0 erros**
- `bun run check` (oxlint) = **0 erros**
- `bun run build` passa
