# Plano 03 — Padrão de Infraestrutura e Extensibilidade Genérica

> Guia canônico para desenvolvedores e IAs adicionarem novas funcionalidades, coleções e layers ao template sem quebrar a arquitetura.

---

## 1. Princípio Fundamental

O starter foi desenhado para ser **100% genérico**, modular e autossuficiente:
- **Zero regras de negócio engessadas**: Não há entidades de nicho ou domínios forçados.
- **Estrutura canônica de 4 pastas**:
  1. `server/` → Define schema, jobs, endpoints e regras de acesso do Payload 3.88 API.
  2. `shared/` → Ponte tipada e stores reativos consumidos por qualquer frontend.
  3. `app/` → Frontend principal (React + TanStack Router).
  4. `layers/` → Ponto de extensão para novos frontends isolados no mesmo monolito.

---

## 2. Como Estender o Template

### A. Adicionando uma Nova Collection no Backend (`server/`)
1. Crie `server/collections/<slug>.ts` exportando a constante `CollectionConfig`.
2. Registre a collection no array `collections` de `server/config.ts`.
3. O script de inicialização do Bun roda `generateTypes` automaticamente e atualiza `server/types.ts`.

### B. Adicionando uma Nova Rota no Frontend Principal (`app/`)
1. Crie o arquivo em `app/routes/<caminho>.tsx` usando `createFileRoute`.
2. Rode `bun run routes:gen` para atualizar `app/routeTree.gen.ts`.
3. Consuma dados usando os stores reativos:
   ```tsx
   import { useCollection } from '@/shared/stores';
   
   const { docs, status, find, create } = useCollection('minha-collection');
   ```

### C. Adicionando um Novo Frontend Isolado (`layers/`)
1. Crie a pasta `layers/<nome>/` contendo:
   - `index.html`
   - `main.tsx` (configurado com `basepath: '/<nome>'`)
   - `routes/__root.tsx` e rotas filhas.
2. No arquivo `index.ts` raiz:
   ```ts
   import novaLayer from '@/layers/<nome>/index.html';
   
   // Dentro de buildRoutes():
   '/nome/*': novaLayer,
   ```

---

## 3. Checklist de Integridade
- [x] Nunca usar `fetch` direto no frontend — usar sempre `@payloadcms/sdk` e `shared/stores/`.
- [x] Nunca editar manualmente arquivos gerados (`server/types.ts`, `routeTree.gen.ts`).
- [x] Servidor e bundling centralizados no Bun.
