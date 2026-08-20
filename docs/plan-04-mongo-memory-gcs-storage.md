# Plano 04 — Integração de MongoDB Memory Server e Migração para Google Cloud Storage (GCS)

> Especificação técnica e passos de implementação para suporte a MongoDB em memória (dev/testes) e substituição de `@payloadcms/storage-vercel-blob` por `@payloadcms/storage-gcs`.

---

## 1. Contexto & Objetivos

1. **MongoDB em Memória (`mongodb-memory-server` / fallback inteligente)**:
   - Permitir que desenvolvedores executem o template sem precisar de um servidor MongoDB externo configurado previamente.
   - Em ambiente de desenvolvimento ou CI/testes, se `MONGODB_URI` não estiver definido, inicializar automaticamente uma instância em memória ou conectar transparentemente.
   - Manter compatibilidade nativa com `@payloadcms/db-mongodb` e o runtime do Bun.

2. **Migração de Storage: Vercel Blob ➔ Google Cloud Storage (GCS)**:
   - Substituir a dependência `@payloadcms/storage-vercel-blob` por `@payloadcms/storage-gcs`.
   - Adicionar configuração nativa com suporte a fallback gracioso (se credenciais GCS/bucket não estiverem presentes, o Payload grava em armazenamento local/disco sem quebrar a inicialização).
   - Atualizar `.env.example`, `server/config.ts`, `package.json` e a documentação em `.gemini/skills/payload/`.

---

## 2. Arquitetura da Solução

### A. MongoDB Memory Server no Bun (`server/db.ts` ou lifecycle no `server/config.ts`)

- **Desafio**: `mongodb-memory-server` baixa o binário oficial do mongod e roda como processo filho. No Bun / Linux sandboxed, pode requerer download sob demanda ou timeout se não houver internet rápida.
- **Estratégia Recomendada**:
  1. Se `process.env.MONGODB_URI` estiver definido, conectar diretamente a essa URI.
  2. Se `MONGODB_URI` não estiver definido:
     - Em desenvolvimento (`NODE_ENV !== 'production'`), inicializar dinamicamente o `MongoMemoryServer` via `mongodb-memory-server` (ou utilitário de boot em `server/db/memory.ts`).
     - Obter a connection string gerada (ex.: `mongodb://127.0.0.1:xxxxx/payload-dev`) e repassar ao `mongooseAdapter`.
     - Fazer cleanup gracioso no encerramento do processo (`process.on('SIGINT')`, `process.on('SIGTERM')`).
  3. Prover script/flag para persistência leve ou teste unitário via `bun test`.

### B. Google Cloud Storage (`@payloadcms/storage-gcs`)

- **Pacote**: `@payloadcms/storage-gcs` (versão `~3.88.0` para coincidir com o ecossistema Payload 3.88).
- **Configuração no `server/config.ts`**:
  ```ts
  import { gcsStorage } from '@payloadcms/storage-gcs';

  // Configuração condicional segura para não quebrar sem chaves
  const plugins = [
    mcpPlugin({ ... }),
    ...(process.env.GCS_BUCKET
      ? [
          gcsStorage({
            collections: { media: true },
            bucket: process.env.GCS_BUCKET,
            options: {
              projectId: process.env.GCS_PROJECT_ID,
              ...(process.env.GCS_CREDENTIALS
                ? { credentials: JSON.parse(process.env.GCS_CREDENTIALS) }
                : {}),
            },
          }),
        ]
      : []),
  ];
  ```
- **Fallback**: Se `GCS_BUCKET` não for fornecido, a collection `Media` opera salvando no diretório local do servidor (comportamento nativo do Payload para uploads).

---

## 3. Plano de Ação

1. **Instalar Pacotes**:
   - `bun add @payloadcms/storage-gcs@~3.88.0`
   - `bun add -d mongodb-memory-server`
   - `bun remove @payloadcms/storage-vercel-blob`
2. **Implementar Gerenciador de Conexão MongoDB**:
   - Criar helper `server/db/index.ts` que resolve a URI (real vs memória).
3. **Atualizar `server/config.ts`**:
   - Integrar `server/db/index.ts` no `db: mongooseAdapter({ url })`.
   - Substituir `vercelBlobStorage` por `gcsStorage`.
4. **Atualizar `.env.example` e Documentação**:
   - Adicionar variáveis do GCS (`GCS_BUCKET`, `GCS_PROJECT_ID`, `GCS_CREDENTIALS`).
   - Remover `BLOB_READ_WRITE_TOKEN`.
   - Atualizar referências de storage em `.gemini/skills/payload/`.
5. **Verificação & Testes**:
   - Executar `bunx oxlint --quiet` e `bun run build`.
