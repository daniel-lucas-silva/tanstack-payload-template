# Plano 06 — Integração PWA e Workbox no Template Fullstack

## Contexto & Objetivo

Integrar suporte nativo a **PWA (Progressive Web App)** com **Workbox** e **Bun** no starter template **Fullstack Payload + TanStack**, baseando-se nas capacidades e arquitetura de `.tmp/bun-react-pwa/`.

O objetivo é transformar a aplicação em um PWA instalável, offline-ready e com sincronização em background, mantendo a arquitetura modular e aderente ao design system do projeto.

---

## 1. Arquitetura PWA no Template

```
[Cliente / Browser]
    │
    ├── Manifest (/manifest.webmanifest) + Ícones (/icons/*) + Fallback (/offline.html)
    │
    ├── workbox-window (shared/pwa/register.ts) ──▶ Ciclo de vida (install, waiting, active)
    │
    ├── React Hooks & Stores (shared/pwa/use-pwa.ts)
    │     ├── isOnline / isOffline
    │     ├── isInstallable / promptInstall()
    │     ├── updateAvailable / applyUpdate()
    │     └── syncStatus / pushNotification helper
    │
    └── Service Worker (/sw.js -> app/sw.ts)
          ├── Precaching (self.__WB_MANIFEST injetado via workbox-build)
          ├── Navigation Preload (workbox-navigation-preload)
          ├── Recipes (pageCache, staticResourceCache, imageCache, offlineFallback)
          ├── Estratégias de API (GET /api/* -> StaleWhileRevalidate + CacheableResponse)
          ├── Background Sync (POST/PUT/DELETE mutations enfileiradas offline)
          ├── Push Notifications (Web Push VAPID + click handlers)
          └── Comunicação bidirecional (MessageChannel, SKIP_WAITING, PING/PONG)

[Servidor / Bun]
    ├── index.ts ──▶ Serve /sw.js (bundle dinâmico em dev, dist/sw.js em prod)
    │            ──▶ Serve arquivos estáticos de public/ (manifest, ícones, offline.html)
    │            ──▶ Endpoints PWA (/api/pwa/*: VAPID public key, push subscribe/send)
    │
    └── build.ts ──▶ Bun.build + workbox-build (injectManifest) para produção
```

---

## 2. Etapas de Execução

1. **Instalação das dependências Workbox & Web-Push**:
   - `workbox-window`, `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-expiration`, `workbox-cacheable-response`, `workbox-background-sync`, `workbox-navigation-preload`, `workbox-recipes`, `web-push`.
   - DevDependencies: `workbox-build`, `@types/web-push`.

2. **Ativos Estáticos PWA em `public/` & `app/index.html`**:
   - `public/manifest.webmanifest`: manifesto com `standalone`, ícones 192x192 e 512x512, tema e cores de fundo.
   - `public/offline.html`: fallback visual com Tailwind para quando a rede estiver indisponível e o recurso não estiver em cache.
   - `public/icons/`: ícones 192px e 512px copiados para uso em desktop e mobile.
   - `app/index.html`: tags `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon">`.

3. **Service Worker (`app/sw.ts`)**:
   - Totalmente tipado com Workbox.
   - `self.__WB_MANIFEST` pronto para substituição por `workbox-build injectManifest`.
   - Suporte a cache offline inteligente para páginas, recursos estáticos, imagens e APIs.
   - Background Sync Queue com notificações `postMessage` para a UI (`SYNC_COMPLETED`, `QUEUED`).
   - Gerenciamento de notificações push com ações (abrir/fechar) e vibração.

4. **Abstração Reutilizável no Frontend (`shared/pwa/`)**:
   - `shared/pwa/register.ts`: Wrapper para `workbox-window` com registro, detecção de atualizações e comunicação.
   - `shared/pwa/use-pwa.ts`: Hook reativo para status de rede, prompt de instalação, atualizações e sincronização.
   - `shared/pwa/push.ts`: Utilitários para conversão de chaves VAPID e inscrição em notificações Push.
   - Componentes visuais: `InstallPrompt`, `UpdateBanner`, `OfflineBadge`, `PWAStatus`.

5. **Servidor Bun & Endpoints de Push (`index.ts` & `server/endpoints/pwa.ts`)**:
   - Atualização de `index.ts` para servir `/sw.js` com headers corretos (`no-cache`).
   - Suporte opcional a Web Push no servidor com armazenamento in-memory/Payload para inscrições.

6. **Script de Build (`build.ts`)**:
   - Compilação dos bundles e do Service Worker.
   - Execução de `injectManifest` de `workbox-build` para gerar `dist/sw.js` com lista exata de hashes.

7. **Interface / Showcase PWA (`app/routes/pwa/index.tsx`)**:
   - Rota no TanStack Router permitindo testar e demonstrar todas as capacidades PWA (Offline, Install, Sync, Push, Cache, Update).

8. **Validação & Testes**:
   - `bun run routes:gen`
   - `bunx oxlint --quiet <path>`
   - `bun run build`
