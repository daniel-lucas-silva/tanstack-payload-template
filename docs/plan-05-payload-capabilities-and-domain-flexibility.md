# Plano 05 — Catálogo de Capacidades do Payload vs. Flexibilidade de Domínio

> Documentação do propósito da pasta `server/` como catálogo demonstrador de capacidades e diretrizes para agentes/desenvolvedores adaptarem schemas a novos domínios.

---

## 1. Contexto & Motivação

O template foi desenvolvido com uma pasta `server/` rica em exemplos práticos de Payload 3.88 (API-only com Bun e MongoDB).

**Ponto Fundamental:**
A pasta `server/` **NÃO** é um schema rígido de negócio obrigatório para todos os projetos (ex.: posts, comments, field-showcase). Ela foi concebida como um **catálogo vivo de capacidades técnicas** que demonstra *como* o Payload 3.88 funciona na prática:
- Como estruturar collections simples, relacionais, com upload ou auth.
- Como aplicar Access Control refinado (RBAC, row-level security, narrow de `req.user`).
- Como escrever Hooks seguros (anti-loop via `context`, transações atômicas com `req`).
- Como registrar Jobs em background (Tasks e Workflows) e Endpoints REST customizados.
- Como ligar tudo isso no `server/config.ts` de forma modular (uma responsabilidade por arquivo).

---

## 2. Princípio de Flexibilidade de Domínio para a IA e Desenvolvedores

Quando um novo projeto for iniciado a partir deste template, o agente de IA e o desenvolvedor devem **adequar o backend ao domínio do usuário**:

| Cenário / Domínio | Ação Esperada |
| ----------------- | ------------- |
| **E-commerce** | Criar collections como `products`, `orders`, `cart`, `categories`, `coupons`. |
| **Clínica / Saúde** | Criar collections como `patients`, `appointments`, `doctors`, `medical-records`. |
| **SaaS / CRM** | Criar collections como `leads`, `deals`, `contacts`, `organizations`, `activities`. |
| **Imobiliária** | Criar collections como `properties`, `agents`, `inquiries`, `amenities`. |
| **Blog / Conteúdo** | Adaptar ou usar `posts`, `categories`, `authors`, `media`. |

> **Regra de Ouro:** O agente de IA **NUNCA** deve tentar forçar ou reutilizar schemas demonstrativos (como `posts` ou `field-showcase`) em domínios não relacionados, a menos que o usuário peça explicitamente. O agente deve **criar as collections do domínio específico**, usando os padrões e boas práticas demonstrados no catálogo.

---

## 3. Como Utilizar o Catálogo de Referência

A pasta `.agents/skills/payload/` e a pasta `server/` fornecem a referência completa:

1. **Para Criar Novas Collections de Domínio**:
   - Crie `server/collections/<entidade>.ts` exportando `CollectionConfig`.
   - Adicione campos usando o sistema de tipos do Payload (`text`, `number`, `relationship`, `upload`, `select`, `array`, `group`, `blocks`, `slugField`).
   - Importe e registre a collection no array `collections` de `server/config.ts`.
   - No boot (`bun dev`), o `generateTypes` atualizará automaticamente `server/types.ts`.

2. **Para Access Control do Novo Domínio**:
   - Defina regras granulares em `server/access/` ou diretamente na collection.
   - Use o type guard `isUser(req.user)` para garantir tipagem segura quando há múltiplas collections de autenticação.
   - Retorne booleanos simples ou queries do tipo `Where` para segurança a nível de linha (ex.: `{ organization: { equals: req.user.orgId } }`).

3. **Para Consumo no Frontend TanStack**:
   - Consuma a nova entidade sem necessidade de `fetch` manual:
     ```tsx
     const { docs, find, create, update, remove } = useCollection('products');
     ```
   - O SDK e os stores compartilham a tipagem fim-a-fim gerada pelo Payload.

---

## 4. O que Manter vs. O que Substituir

- **Manter sempre (Infraestrutura/Plumbing)**:
  - Ponto de montagem: `server/config.ts`.
  - Adapter do banco: `mongooseAdapter` + helper `server/db`.
  - Plugins essenciais: Storage (GCS/local), MCP, etc.
  - Geração de tipos: `server/types.ts` via `generateTypes`.
  - Camada compartilhada: `shared/lib/sdk.ts` e `shared/stores/`.
- **Substituir / Customizar conforme o Domínio**:
  - `server/collections/*`: criar as collections específicas do negócio.
  - `server/globals/*`: criar as configurações globais do negócio.
  - `server/endpoints/*`: criar endpoints específicos se necessário.
  - `server/jobs/*`: criar background tasks/workflows específicos.
  - `app/routes/*`: criar as telas e rotas de acordo com a interface solicitada.

---

## 5. Próximos Passos & Documentação

- Atualizar `docs/arquitetura.md` e `docs/payload-3.md` reforçando a distinção entre **Catálogo de Capacidades** e **Schema de Domínio**.
- Atualizar `AGENTS.md` e `GEMINI.md` para orientar explicitamente agentes a modelar o domínio solicitado mantendo o padrão modular.
