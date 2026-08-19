# `shared/` — camada de dados compartilhada

Ponte entre o frontend e a API. **O frontend NUNCA usa `fetch` direto** — só o que está aqui.

## Estrutura

- `lib/sdk.ts` — a instância `PayloadSDK<Config>`. **A única porta de acesso à API.**
- `stores/` — stores reativos, tipados fim-a-fim:
  - `useCollection('slug')` → `docs`, `find`, `loadMore`, `refresh`, `create`, `update`, `remove`, `count`, versões.
  - `useGlobal('slug')` → `data`, `findGlobal`, `updateGlobal`, versões.
  - `useAuth('users')` → `user`, `token`, `login`, `logout`, `me`, `refreshToken`, …
  - `types.ts` — tipos derivados do `Config` gerado.
  - `index.ts` — re-exports.

## Regras

- **Auto-fetch**: os hooks já buscam no mount (guarda `status === 'idle'`). Não precisa chamar `find()` manualmente no primeiro load.
- **Singleton por slug**: dois componentes com `useCollection('posts')` compartilham o mesmo estado.
- **Tipado**: `useCollection('posts')` retorna `Post[]`; `create`/`update` exigem os campos certos.
- **Estado de UI/sessão** (carrinho, PWA, etc.) = hook local no `app/`, não store novo.
