# `app/` — frontend (TanStack Router file-based)

A UI do projeto. Rotas são **file-based**: um arquivo por rota em `routes/`.

## Estrutura

- `main.tsx` — `RouterProvider` + `QueryClient`.
- `routes/__root.tsx` — layout raiz (auth guard, shell, sidebar).
- `routes/<caminho>.tsx` — uma rota por arquivo (`createFileRoute`).
- `components/` `layouts/` `lib/` `utils/` — suporte.
- `routeTree.gen.ts` — **GERADO** (nunca edite).

## Regras

- **Nova rota** = criar `routes/<caminho>.tsx` + rodar `bun run routes:gen`.
- **Dados** = só via `shared/stores/` (`useCollection`/`useGlobal`/`useAuth`). Nunca `fetch`.
- **Auth guard** = `beforeLoad` no `__root.tsx` (redireciona pra `/login`).
