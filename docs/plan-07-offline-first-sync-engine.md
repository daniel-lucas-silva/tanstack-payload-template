# Plano 07 — Engine de Sincronização Offline-First e Optimistic Updates para Stores Payload

## Contexto & Diagnóstico

Atualmente, os stores do template (`useCollection`, `useGlobal`) realizam chamadas diretas e bloqueantes ao `@payloadcms/sdk`:
1. **Latência perceptível na escrita**: `create`, `update` e `remove` aguardam a resolução da Promise de rede (`await sdk.create(...)`) antes de alterar o estado reativo do TanStack Store. Em redes lentas ou instáveis, o usuário sente um delay antes de ver a alteração na tela.
2. **Incapacidade Offline**: Sem conexão, a chamada ao SDK é rejeitada, a UI vai para estado de erro e o dado não é salvo.
3. **Leitura sem cache local instantâneo**: O carregamento inicial começa sempre vazio (`docs: []`, `status: 'idle'`), aguardando o primeiro retorno do servidor para exibir conteúdo.

---

## Objetivos do Novo Sync Engine

1. **Latência Zero na UI (Optimistic UI Updates)**:
   - `create`: Insere o item imediatamente no TanStack Store com `temp_id`, `_optimistic: true` e salva no IndexedDB em 0ms.
   - `update`: Atualiza os campos na hora no estado local e no IndexedDB.
   - `remove`: Remove o item instantaneamente da lista visual.
2. **Leitura Instantânea (Stale-While-Revalidate Local)**:
   - Ao montar o store ou chamar `find()`, carrega o cache do IndexedDB de imediato (`status: 'ready'`), disparando a revalidação com o Payload SDK em segundo plano.
3. **Fila de Sincronização Resiliente (Sync Queue em IndexedDB)**:
   - Todas as mutações locais são registradas numa fila persistente.
   - Em background (quando online), o engine processa a fila usando o `sdk.create`, `sdk.update`, `sdk.delete`.
   - Ao concluir a criação no servidor, reconcilia o `temp_id` com o `id` definitivo gerado pelo MongoDB/Payload.
4. **Auto-Reconexão & Sincronização em Background**:
   - Escuta eventos `online` e mensagens do Service Worker.
   - Reenvio automático com controle de tentativas e tratamento de erros.
5. **Transparência e Compatibilidade**:
   - Mantém 100% de compatibilidade de tipagem com `@payloadcms/sdk` e `server/types.ts`.
   - Não usa `fetch` direto no frontend — toda comunicação com o backend passa pelo `sdk` configurado.
   - Expõe hook `useSync()` com status (`isSyncing`, `pendingCount`, `lastSyncedAt`, `syncNow()`).

---

## Estrutura de Arquivos a Criar/Modificar

```
shared/
  sync/
    db.ts            → Camada IndexedDB com Promises para cache e fila de mutações
    engine.ts        → SyncEngine (reconciliação, fila de envio, mutações otimistas)
    use-sync.ts      → Hook React useSync (status reativo da sincronização)
    components.tsx   → SyncStatusBadge e SyncIndicator (feedback visual na UI)
    index.ts         → Ponto de exportação do módulo de sync
  stores/
    collection.ts    → Atualizado com leitura em cache + mutações otimistas via SyncEngine
    global.ts        → Atualizado com leitura em cache + mutações otimistas
    types.ts         → Tipos atualizados com campos otimistas
app/
  routes/
    posts/index.tsx  → Atualizado para demonstrar resposta instantânea e badge de sync
    pwa/index.tsx    → Atualizado com estatísticas detalhadas da fila de sincronização
```

---

## Passos de Execução

1. Criar `shared/sync/db.ts` com esquema IndexedDB (`cache_collections`, `cache_globals`, `sync_mutations`).
2. Criar `shared/sync/engine.ts` com o ciclo de vida de persistência, mutações otimistas e reconciliação.
3. Criar `shared/sync/use-sync.ts` e `shared/sync/components.tsx`.
4. Atualizar `shared/stores/types.ts`, `shared/stores/collection.ts` e `shared/stores/global.ts`.
5. Exportar tudo limpo em `shared/stores/index.ts` e `shared/sync/index.ts`.
6. Atualizar a página `/posts` e o dashboard `/pwa`.
7. Validar com `bunx oxlint --quiet` e `bun run build`.
8. Criar relatório `docs/report-04-offline-first-sync-implementation.md`.
