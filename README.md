# Fullstack Payload Examples

Starter fullstack **Bun + Payload 3.88 (API pura) + TanStack** — desenhado para que uma IA
(Google Studio, Lovable) leia o código e **imite o padrão** em vez de reinventar.

## Stack

- **Servidor** — `Bun.serve` + Payload 3.88 (`API-only`, sem admin UI)
- **Banco** — MongoDB (`@payloadcms/db-mongodb`)
- **Frontend** — TanStack Router (file-based) + Query + Store + Form + Virtual
- **Dados** — `@payloadcms/sdk` (única porta de acesso à API) + stores reativos próprios

## Quickstart

```sh
bun install
cp .env.example .env    # ajuste MONGODB_URI / PAYLOAD_SECRET
bun dev                 # http://localhost:3333
```

No boot o config gera `server/types.ts` (tipos do Payload) e semeia o primeiro admin (`.env`).

## Estrutura

```
server/config.ts        catálogo de capacidades do Payload (access, hooks, jobs, endpoints, fields)
server/types.ts         GERADO do config — fonte única de verdade da tipagem
shared/lib/sdk.ts       instância do PayloadSDK
shared/stores/          useCollection / useGlobal / useAuth (estado reativo + tipado)
app/routes/             rotas file-based (TanStack Router)
app/routes/posts/       exemplo end-to-end (o "golden path")
```

## Scripts

| Comando              | O que faz                                  |
| -------------------- | ------------------------------------------ |
| `bun dev`            | servidor + HMR (regenera types no boot)    |
| `bun run routes:gen` | gera `routeTree.gen.ts` (rotas file-based) |
| `bun run build`      | build de produção (routes:gen + build.ts)  |
| `bun run check`      | oxlint (0 erros)                           |
| `bun test`           | testes                                     |

## Docs

- [Arquitetura e padrões](docs/arquitetura.md)
- [Payload 3.88 — cheatsheet](docs/payload-3.md)
