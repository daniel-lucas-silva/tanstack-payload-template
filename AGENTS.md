---
description: Fullstack Bun + Payload 3.88 (API-only) + TanStack. Read before editing.
globs: '*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json'
alwaysApply: false
---

# Fullstack Payload Template

Starter **Bun + Payload 3.88 (API pura, sem admin UI) + TanStack** (Router/Query/Store/Form).
O princípio do starter: a IA imita o padrão de `server/` — o `config.ts` só **monta** as
peças de `collections/`, `globals/`, `access/`, `jobs/` e `endpoints/` (não é um arquivo só).

## Comandos

- `bun dev` — servidor + HMR; no boot roda `generateTypes` (regenera `server/types.ts`) e semeia o primeiro admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- `bun run routes:gen` — gera `app/routeTree.gen.ts` (rotas file-based do TanStack). Rode após criar `app/routes/...`.
- `bun run build` — `routes:gen` + `build.ts` (Bun build → `dist/`, roda `bun dist/index.js`).
- `bunx oxlint --quiet <path>` — lint de arquivo/pasta isolado (oxlint-tsgolint; rápido). **A verificação de erros é sempre pontual, nunca global** — rode no arquivo/pasta que mexeu.
- `bun test` — testes (via `bun:test`); hoje não há testes no repo.

## Arquitetura (fluxo de dados)

```
server/config.ts ──(monta)──▶ collections/ globals/ access/ jobs/ endpoints/
     │
     └──(generateTypes no boot)──▶ server/types.ts  (Config)
                                                  ▼
shared/lib/sdk.ts   (PayloadSDK<Config>, única porta de API)
                                                  ▼
shared/stores/      (useCollection / useGlobal / useAuth, estado reativo)
                                                  ▼
app/routes/         (páginas React, TanStack Router file-based)
```

- **`server/`** — o catálogo de capacidades do Payload, **organizado por pastas**:
  `config.ts` (só monta), `collections/`, `globals/`, `access/`, `jobs/`, `endpoints/`.
  Ao adicionar collection/global/job/endpoint, crie o arquivo na pasta certa e registre
  no `config.ts`. Leia os comentários: o avançado está explicado; o básico está só presente.
- **Modelagem de Domínio Flexível**: O `server/` é um **catálogo de capacidades e padrões**, não um schema fixo. Ao iniciar ou desenvolver novos projetos (ex.: e-commerce, clínica, CRM, reservas), **crie as collections e rotas do domínio solicitado**, aplicando os padrões modulares demonstrados, sem forçar o uso de collections de demonstração (`posts`, `field-showcase`, etc.).
- **`server/types.ts`** e **`app/routeTree.gen.ts`** — GERADOS. Nunca edite. `types.ts`
  regenera no boot do `bun dev`; `routeTree.gen.ts` regenera com `bun run routes:gen`.
- **`shared/`** — lib (`sdk.ts`), `stores/` (reativos), `pwa/` (Workbox hooks, registro e componentes).
- **`app/`** — `routes/` (páginas TanStack), `sw.ts` (Service Worker Workbox), `index.html` (entrypoint com manifest PWA).
- **Acesso à API no frontend SÓ via** `@payloadcms/sdk` (`shared/lib/sdk.ts`) e os stores
  de `shared/stores/`. **Não use `fetch` direto.**
- Stores são **singletons por slug** — `useCollection('posts')` compartilha estado entre componentes.

## Gotchas do Payload 3.88

- `type: 'slug'` **não existe** — use `slugField({ useAsSlug: 'campo' })` de `'payload'`
  (marca o slug como required nos tipos).
- Duas collections auth (`users`, `api-keys`) fazem `req.user` virar união
  (`User | ApiKey`) — faça **narrow por `collection`** com o type guard `isUser`
  em `server/access/index.ts` (nunca typecast) antes de acessar `roles`/`email`.
- `afterChange` que chama `req.payload.update` re-dispara o hook → loop. Use o guard
  `context.triggerAfterChange === false` (ver `Posts`).
- `graphQL.disable` está ligado — API é REST (consumida pelo SDK).

## Documentação de trabalho (planos, reports, decisões)

- **Plano, relatório, decisão ou nota de trabalho vai para `docs/`** como markdown,
  **numerado em ordem** para rastrear o histórico — ex.: `docs/plan-01-<slug>.md`,
  `docs/report-01-<slug>.md`.
- **Não mostre o plano só no chat** — grave em `docs/` antes (ou junto) de apresentar.
- A cada novo documento, **incremente o número** (não sobrescreva os anteriores).

## Referências

- Padrão completo ("golden path"): `app/routes/posts/index.tsx`.
- Docs: [`docs/arquitetura.md`](docs/arquitetura.md) · [`docs/payload-3.md`](docs/payload-3.md).
