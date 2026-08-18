# PLAN — Fullstack Payload Examples (starter)

> Starter fullstack "à prova de IA" (para usar com Google Studio / Lovable).
> Princípio: **a IA imita o padrão**. Então o padrão precisa estar 100% íntegro:
> instala, roda e gera em qualquer máquina, sem warnings nem referências soltas.

---

## 1. Visão

- **Bun nativo** (HTML imports, `Bun.serve`, WebSocket, `bun test`) — sem Vite
- **Payload 3.88 (stable) como API pura** — sem admin UI, sem canary
- **TanStack stack** no frontend: Router, Query, Store, Form, Virtual
- **`@payloadcms/sdk`** como única porta de acesso à API no frontend
- Estrutura inspirada no Nuxt: `server/` · `app/` · `shared/` · `layers/`
- **Uma fatia vertical completa** (orders) como caminho dourado

## 2. Stack travada (versões pinadas — NADA de `latest`)

| Pacote                                | Versão      | Papel                            |
| ------------------------------------- | ----------- | -------------------------------- |
| `payload`                             | `~3.88.0`   | API (stable, API-only)           |
| `@payloadcms/db-mongodb`              | `~3.88.0`   | Banco                            |
| `@payloadcms/sdk`                     | `~3.88.0`   | Client REST no frontend          |
| `@payloadcms/email-resend`            | `~3.88.0`   | Email (opcional)                 |
| `@tanstack/react-router`              | `^1.170.17` | Rotas                            |
| `@tanstack/react-query`               | `^5.101.4`  | Server state                     |
| `@tanstack/react-store`               | `^0.11.0`   | Client state                     |
| `@tanstack/react-form`                | `^1.33.2`   | Formulários                      |
| `@tanstack/react-virtual`             | `^3.14.8`   | Listas longas                    |
| `@tanstack/store`                     | `^0.11.0`   | Store agnóstico (shared)         |
| `@tanstack/zod-form-adapter`          | `^0.42.1`   | Validação zod no form            |
| `@tanstack/router-cli`                | pinned      | Codegen de rotas (se file-based) |
| `react` / `react-dom`                 | `19`        | UI                               |
| `tailwindcss` + `bun-plugin-tailwind` | `4`         | CSS                              |

> ✅ **Verificado no npm**: `@payloadcms/sdk@latest` = `3.88.0` — o SDK
> trackeia a versão do servidor. Pin `~3.88.0` nos dois e não há conflito.

## 3. Fases

### Fase 0 — Fundação (consertar o que está quebrado hoje)

1. Pinar versões no `package.json` (hoje: `payload: "latest"` = 3.88 instalada, mas sem pin; `@tanstack/*` e `@payloadcms/sdk` **ausentes**).
2. Scripts (hoje apontam pra `src/index.ts` que não existe):
   - `dev`: `bun --watch index.ts`
   - `start`: `NODE_ENV=production bun dist/index.js`
   - `build`: `bun run build.ts`
   - `typegen`: gerar `server/types.ts`
   - `check`: `bunx oxlint . --quiet`
   - `test`: `bun test`
3. `.env.example` (`MONGODB_URI`, `PAYLOAD_SECRET`, `PORT`) + leitura via `Bun.env` no boot (hoje: sem `.env` o servidor crasha).
4. Estrutura final de pastas + remover `app/index.ts` quebrado (import de HTML mora no `index.ts` raiz).
5. `layers/` — **DECIDIDO: manter**. Daniel quer ver depois como vai adicionar módulos ali (inspiração Nuxt layers).

### Fase 1 — Camada API (`server/`)

1. `config.ts` limpo para **3.88**:
   - ❌ `type: 'slug'` **não existe** na v3.88 → `{ type: 'text', unique: true }` + hook `beforeChange` gerando o slug
   - Corrigir assinaturas de jobs: workflow **não** recebe `input` no handler (usa `job.input`); `inlineTask(...)` resolve **direto no output** (não `{ output }`)
   - Remover refs soltas: `payments` no `beforeDelete`, `notifyKitchen` no workflow
   - Guards: `data` possibly undefined nos hooks; tipar `validate: (value) => ...`; `String(req.routeParams?.id)`
2. Collections de exemplo:
   - `users` (auth: `useAPIKey`, RBAC simples, field access anti auto-promoção)
   - `orders` (negócio: hooks, access boolean+Where, endpoints, virtual field)
   - `media` (upload: `imageSizes`, `adminThumbnail`, `mimeTypes`)
   - `field-showcase` (TODOS os fields da v3: text, textarea, email, number, checkbox, select, radio, date, json, code, point, relationship+filterOptions, upload, array, group, blocks, tabs, row, collapsible, join, ui, richText)
3. Access: collection (boolean + Where row-level), field, global.
4. Jobs: task `sendOrderConfirmation` (input/output schemas, retries+backoff, schedule cron, onSuccess/onFail) + workflow `fulfillOrder` (task registrada + inlineTask).
5. Endpoints: root (`/api/health`), collection (`orders/total`), global.
6. `server/types.ts` gerado do config (fonte única de verdade) — boot em dev + script `typegen`.

### Fase 2 — O jeito Bun (infra)

1. `index.ts`: `Bun.serve(3333)` com routes `'/api/*'` → `handleEndpoints({ config })` e `'/'` → HTMLBundle.
2. **HTML import**: `import app from './app/index.html'` — dev serve `app.index` e resolve assets por `app.files` (path hasheado + headers com etag/content-type).
3. `build.ts`: `Bun.build` com entrypoints `['./index.ts', './app/index.html']` → `dist/` com assets hasheados; produção serve o `dist/` (hoje: `public/` não é copiado, quebra em prod).
4. WebSocket de exemplo (status de pedido em tempo real): server instance global + broadcast no hook `afterChange` do Payload.
5. `bunfig.toml` (serve static + plugins).

### Fase 3 — Frontend TanStack

1. **Router** — **DECIDIDO: file-based** (`app/routes/` + `routeTree.gen.ts` via `@tanstack/router-cli`, config em `tsr.config.json`, scripts `routes:gen` / `routes:gen:watch`).
2. **Query**: `query-client.ts` + hooks de dados via **`@payloadcms/sdk`** (`useOrders`, `useOrder(id)`, mutations). SDK = única porta de acesso à API.
3. **Store** (`@tanstack/store` + `react-store`): estado cliente (cart, UI). ⏳ **Fase do Daniel (depois)**: criar um **collection-store** próprio — funciona como o tanstack-db, porém melhor (inspirado numa lib Flutter que ele já fez). Store por collection com métodos que usam o SDK e fazem mais que o básico.
4. **Form** (react-form + zod-form-adapter): exemplo de criar pedido/checkout.
5. **Virtual** (react-virtual): lista longa (histórico de pedidos / estoque). ⏳ Ideias junto com o collection-store (fase do Daniel).

### Fase 4 — Fatias verticais (o caminho dourado)

1. **Orders end-to-end**: collection → endpoint → hook do SDK → páginas (lista + detalhe + form de criação).
2. **Auth**: endpoint login + cookie + rota protegida (middleware do router).
3. **Realtime**: websocket de status do pedido.
4. (Opcional) Upload de mídia.

### Fase 5 — Docs para agents (o segredo)

1. `AGENTS.md`: o jeito Bun (HTML imports, `--watch`, `bun test`, **sem vite**), fluxo Payload (config → types gerados → SDK no frontend), convenções, comandos e gotchas (slug não existe na v3, assinaturas de jobs, `data` undefined, etc.).
2. `README.md`: quickstart de 3 comandos (`bun install` → `.env` → `bun dev`).
3. `docs/arquitetura.md`: diagrama do fluxo de dados (HTML import, API, types).
4. `docs/payload-3.md`: cheatsheet do que o agent precisa saber.

### Fase 6 — Gates de verificação

- `bunx oxlint . --quiet` → 0 erros
- `bun run build` → passa e emite `dist/` completo
- Boot limpo com `.env` de exemplo (Mongo local ou Atlas sandbox)
- Smoke test: `curl /api/health`, página renderiza, types regeneram
- `bun test` nos handlers de jobs

## 4. Decisões em aberto

| #   | Decisão             | Opções                                         | Decisão                       |
| --- | ------------------- | ---------------------------------------------- | ----------------------------- |
| 1   | Rotas               | a) file-based + `tsr generate` · b) code-based | **a — file-based** (DECIDIDO) |
| 2   | `layers/`           | a) manter documentado · b) remover             | **a — manter** (DECIDIDO)     |
| 3   | Store/Virtual       | collection-store próprio (Daniel, depois)      | ⏳ fase do Daniel             |
| 4   | Admin UI do Payload | a) expor em `/admin` · b) API pura             | **b — API pura** (definido)   |
