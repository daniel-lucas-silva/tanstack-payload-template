# `server/` — API Payload (API-only)

Aqui vive o **schema e a lógica de servidor** do Payload. **Sem admin UI** — só a API REST.

## Estrutura

- `config.ts` — **ponto de montagem**. Só importa as peças abaixo e chama `buildConfig`.
- `collections/<slug>.ts` — uma collection por arquivo.
- `globals/<slug>.ts` — globals.
- `access/index.ts` — funções de access control reutilizáveis (`isUser`, `admins`, `selfOrAdmin`, …).
- `jobs/index.ts` — tasks e workflows.
- `endpoints/index.ts` — endpoints raiz.
- `types.ts` — **GERADO** (nunca edite; regenera no `bun dev`).

## Regras

- **Adicionar collection** = criar `collections/<slug>.ts` + registrar em `config.ts`.
- **Slug** = `slugField({ useAsSlug: 'campo' })` (não existe `type: 'slug'`).
- **2+ collections auth** → `req.user` é união; faça **narrow** com o type guard `isUser`
  (nunca typecast) antes de acessar `roles`/`email`.
- **`afterChange` que chama `update`** re-dispara o hook → use o guard `context`.
- **GraphQL desligado** — a API é REST (consumida pelo SDK).
