# `layers/` — Aplicações Secundárias (Multi-Frontend no Monolito)

Esta pasta é reservada para **frontends adicionais** no mesmo monolito (ex.: portais, painéis administrativos, áreas de membros ou aplicações satélite).

Todas as layers compartilham a mesma instância do `server/` (Payload API) e do `shared/` (SDK tipado e stores reativos), mas possuem **seus próprios bundles, pontos de entrada HTML e rotas**.

---

## Estrutura Padrão de uma Layer

Para criar uma nova layer (ex.: `layers/<nome>/`):

```
layers/<nome>/
  ├── index.html        # Entrypoint HTML que importa o main.tsx
  ├── main.tsx          # Configuração do createRouter com basepath: '/<nome>'
  ├── tsr.config.json   # Configuração do TanStack Router para esta pasta (opcional/isolado)
  ├── routeTree.gen.ts  # Árvore de rotas gerada pelo TanStack Router
  └── routes/           # Rotas file-based da layer
      ├── __root.tsx    # Layout raiz e possíveis guards da layer
      └── index.tsx     # Página inicial da layer (renderiza em /<nome>)
```

---

## Como Montar a Layer no `index.ts`

No arquivo raiz `index.ts`, importe o `index.html` da layer e registre a rota antes do catch-all do frontend principal:

```ts
import app from '@/app/index.html';
import admin from '@/layers/admin/index.html';

// No mapeamento de rotas do Bun.serve:
const routes = {
  '/api/*': async (req) => handleEndpoints({ config: serverConfig, request: req }),
  '/admin/*': admin, // 👈 Layer secundária isolada
  '/*': app,         // 👈 Frontend principal (catch-all)
};
```

---

## Boas Práticas e Regras

1. **Reutilize via `shared/`**:
   - Consuma a API exclusivamente por `@payloadcms/sdk` (`shared/lib/sdk.ts`) e pelos stores reativos (`shared/stores/`).
   - Componentes e utilitários globais devem residir em `shared/`.
2. **Defina o `basepath` no TanStack Router**:
   - No `main.tsx` da sua layer, passe `basepath: '/<nome>'` ao `createRouter(...)` para que a navegação interna funcione perfeitamente com a rota do Bun.
3. **Isolamento de Segurança**:
   - Guards de autenticação e permissão definidos no `__root.tsx` de uma layer afetam apenas aquela layer, garantindo total desacoplamento de acesso.

