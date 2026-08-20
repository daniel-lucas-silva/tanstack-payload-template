# Plano 01 — Diretrizes de Manutenção e Melhoria do Template

> Documento de alinhamento e plano de melhoria contínua do starter **Fullstack Bun + Payload 3.88 + TanStack**.

---

## 1. Objetivo e Escopo

- **Propósito**: O repositório é estritamente um **TEMPLATE / STARTER STARTER FULLSTACK**, e NÃO uma aplicação final/site consumidor.
- **Foco de trabalho**:
  1. Preservação integral da arquitetura (`server/`, `shared/`, `app/`, `layers/`, `docs/`).
  2. Garantia de tipagem fim-a-fim limpa sem types manuais soltos.
  3. Respeito rigoroso às regras do Payload 3.88 (API pura, `slugField`, narrow de `req.user`, `afterChange` loops).
  4. Respeito ao acesso via `@payloadcms/sdk` e stores reativos (`useCollection`, `useGlobal`, `useAuth`) sem `fetch` direto.
  5. Scripts e pipeline Bun íntegros (`bun dev`, `bun run routes:gen`, `bun run build`, `oxlint`).

---

## 2. Pilares Arquiteturais Intocáveis

- **Infraestrutura**:
  - Servidor HTTP e bundling nativos do **Bun** (`index.ts`, `build.ts`, `bunfig.toml`).
  - Sem Vite, sem Express, sem scripts legados do Node.
- **Payload 3.88 API-Only**:
  - Sem Admin UI.
  - Ponto de montagem único em `server/config.ts`.
  - Collections, Globals, Access, Jobs e Endpoints organizados por pastas.
- **Frontend TanStack**:
  - Router file-based (`app/routes/`, `tsr.config.json`).
  - TanStack Store + TanStack Query integrados aos stores em `shared/stores/`.
- **Governança de Documentação**:
  - Planos, relatórios e decisões registrados em `docs/` com numeração sequencial.

---

## 3. Checklist de Verificação Contínua

1. `server/types.ts` e `app/routeTree.gen.ts` são gerados e nunca editados manualmente.
2. `bunx oxlint --quiet <path>` com 0 erros no escopo alterado.
3. `bun run build` executa e passa com sucesso.
