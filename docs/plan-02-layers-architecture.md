# Plano 02 — Arquitetura de `layers/` (Multi-Frontend no Monolito com Bun + TanStack)

> Especificação de como estruturar e conectar múltiplas aplicações isoladas em `layers/` (ex.: `layers/<nome>/`) usando os HTML Imports nativos do Bun e TanStack Router.

---

## 1. Visão Geral do Conceito

Assim como no Nuxt onde camadas compartilham infraestrutura e código base, o padrão de `layers/` neste starter transforma o projeto em um **Monolito Multi-Frontend**:

```
                              ┌──▶ app/ (Frontend Principal / Web App)
                              │
server/ (Payload 3.88 API) ───┼──▶ layers/<layer-a>/ (Frontend Secundário A)
  ▲                           │
  │ (SDK & Stores)            └──▶ layers/<layer-b>/ (Frontend Secundário B)
  │
shared/ (lib/sdk.ts, stores/, utils/)
```

Todos os frontends rodam no **mesmo processo do Bun**, compartilham a **mesma API do Payload**, os mesmos **tipos gerados (`server/types.ts`)** e os mesmos **stores reativos (`shared/stores/`)**.

---

## 2. Como Funciona o `index.ts` com Múltiplas Layers

O Bun suporta **HTML Imports nativos**. Cada `index.html` vira um bundle autônomo com seu próprio entrypoint React/TypeScript.

### Padrão de Montagem no `index.ts`:

```ts
import app from '@/app/index.html';
import portal from '@/layers/portal/index.html';
import payloadConfig from '@/server/config';

// ...
async function buildRoutes() {
  const routes = {
    // 1. API do Payload (sempre prioridade para endpoints)
    '/api/*': async (request) => {
      return await handleEndpoints({ config: serverConfig, request });
    },

    // 2. Layers secundárias com prefixo de rota
    '/portal/*': portal,

    // 3. Frontend principal (catch-all)
    '/*': app,
  };

  return routes;
}
```

> **Ordem de precedência no Bun.serve**:
> Rotas mais específicas (`/api/*`, `/portal/*`) devem ser declaradas antes do catch-all raiz (`/*`).

---

## 3. Estrutura Interna de uma Layer Genérica (ex: `layers/<nome>/`)

Cada layer replica a simplicidade do `app/`:

```
layers/<nome>/
  ├── index.html        → <script type="module" src="./main.tsx"></script>
  ├── main.tsx          → createRouter com basepath: '/<nome>'
  ├── tsr.config.json   → config de rotas do TanStack para a layer (se isolado)
  ├── routeTree.gen.ts  → GERADO para esta layer
  └── routes/           → TanStack Router file-based
      ├── __root.tsx    → layout raiz e guards da layer
      └── index.tsx     → renderiza em /<nome>
```

### Exemplo do `layers/<nome>/main.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { queryClient } from '@/shared/lib/query-client';
import { routeTree } from './routeTree.gen';
import '@/styles/index.css';

const router = createRouter({
  routeTree,
  basepath: '/portal', // 👈 Crucial: prefixo correspondente à rota no index.ts
  context: { queryClient },
});

const elem = document.getElementById('root')!;
createRoot(elem).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
```

---

## 4. Vantagens do Padrão

1. **Zero Sobrecarga de Rede**: Sem microfrontends, sem iframes, sem múltiplos containers. É um único binário/servidor Bun.
2. **Isolamento de Bundles**: O bundle do app principal não baixa o código das layers secundárias e vice-versa. O Bun empacota cada HTML separadamente.
3. **Compartilhamento de Código Puro**: `shared/stores/` e `@payloadcms/sdk` são compartilhados sem necessidade de monorepos complexos.
4. **Segurança e Guards**: O guard de autenticação fica restrito ao `__root.tsx` de cada frontend, sem vazar regras de acesso.

