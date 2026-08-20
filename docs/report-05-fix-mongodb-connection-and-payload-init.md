# Relatório 05 — Correção do Erro de Conexão MongoDB e Inicialização do Payload

## Problema Identificado

Durante a inicialização do Payload CMS no ambiente de container/dev, o servidor falhava com os seguintes erros:
1. `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
2. `NotImplementedError: node:v8 isBuildingSnapshot is not yet implemented in Bun`

### Causa Raiz
- A variável de ambiente `MONGODB_URI` estava definida por padrão como `mongodb://localhost:27017/fullstack-payload-examples`, mas no ambiente de contêiner não havia um processo standalone de `mongod` rodando na porta local 27017.
- Quando o sistema tentava recorrer ao `mongodb-memory-server`, a biblioteca `bson` (dependência do Mongoose/MongoDB) tentava invocar `startupSnapshot.isBuildingSnapshot()` do módulo `node:v8`, recurso ainda não implementado no runtime do Bun, causando exceção e abortando a inicialização do servidor em memória.

---

## Soluções Aplicadas

1. **Bootstrap Polyfill (`server/bootstrap.ts`)**:
   - Criação de um módulo de inicialização antecipada que simula com segurança o método `v8.startupSnapshot.isBuildingSnapshot()`, evitando que `bson.cjs` lance `NotImplementedError` no Bun.
   - Importação desse bootstrap no topo de `index.ts`, `server/config.ts` e `server/db/index.ts`.

2. **Detecção Dinâmica e Fallback Resiliente (`server/db/index.ts`)**:
   - Implementação de `isLocalMongoReachable()` com verificação via socket TCP.
   - Se `MONGODB_URI` apontar para `localhost`/`127.0.0.1` e a porta não estiver ouvindo, o sistema automaticamente inicia uma instância isolada do `MongoMemoryServer`.
   - URIs remotas (ex: MongoDB Atlas ou clusters externos) continuam sendo respeitadas normalmente.

3. **Validação & Testes**:
   - Inicialização do Payload testada e validada com sucesso (`Payload initialized successfully! Admin seeded`).
   - Requisições REST (`/api/posts`, `/api/globals/site-settings`) respondendo com `200 OK`.
   - `bun run build` e `bunx oxlint` executados com 0 erros.
