/// <reference lib="webworker" />

/**
 * ============================================================================
 * SERVICE WORKER — Workbox + Bun + TanStack + Payload
 * ============================================================================
 *
 * This Service Worker handles offline caching, background synchronization,
 * web push notifications, and runtime asset strategies using Workbox.
 *
 * In production, `workbox-build injectManifest` replaces `self.__WB_MANIFEST`
 * with the pre-cached hashed static assets.
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { Queue } from 'workbox-background-sync';
import { enable as enableNavigationPreload } from 'workbox-navigation-preload';
import { pageCache, staticResourceCache, imageCache, offlineFallback } from 'workbox-recipes';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST?: Array<{ url: string; revision: string | null }>;
};

const precacheManifest = self.__WB_MANIFEST;

// ---------------------------------------------------------------------------
// 1. PRECACHING — App shell and hashed static assets
// ---------------------------------------------------------------------------
if (precacheManifest) {
  precacheAndRoute(precacheManifest);
  cleanupOutdatedCaches();
}

// ---------------------------------------------------------------------------
// 2. NAVIGATION PRELOAD — Parallelize network requests during SW startup
// ---------------------------------------------------------------------------
enableNavigationPreload();

// ---------------------------------------------------------------------------
// 3. RECIPES — Pre-configured Workbox cache strategies
// ---------------------------------------------------------------------------
pageCache();
staticResourceCache();
imageCache();
offlineFallback({ pageFallback: '/offline.html' });

// ---------------------------------------------------------------------------
// 4. API GET ROUTES — StaleWhileRevalidate with caching rules
// ---------------------------------------------------------------------------
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'payload-api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 }),
    ],
  }),
);

// ---------------------------------------------------------------------------
// 5. API MUTATIONS — Background Sync for offline writes
// ---------------------------------------------------------------------------
const notifyClients = async (data: { type: string; [key: string]: unknown }) => {
  const clients = await self.clients.matchAll();
  clients.forEach((client: Client) => client.postMessage(data));
};

const mutationQueue = new Queue('payload-mutation-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
  onSync: async ({ queue }) => {
    try {
      await queue.replayRequests();
    } finally {
      const entries = await queue.getAll();
      await notifyClients({ type: 'SYNC_COMPLETED', remaining: entries.length });
    }
  },
});

// Custom fetch listener for offline queuing of POST/PATCH/DELETE
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  const isApiMutation =
    url.pathname.startsWith('/api/') &&
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(event.request.method) &&
    !url.pathname.startsWith('/api/users/login') && // Avoid background sync on auth login
    !url.pathname.startsWith('/api/pwa/');

  if (!isApiMutation) return;

  const bgSyncHandler = async () => {
    try {
      return await fetch(event.request.clone());
    } catch (error) {
      await mutationQueue.pushRequest({ request: event.request });
      await notifyClients({
        type: 'MUTATION_QUEUED',
        url: url.pathname,
        method: event.request.method,
        error: String(error),
      });

      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Offline: solicitação salva para sincronização futura.',
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  };

  event.respondWith(bgSyncHandler());
});

// ---------------------------------------------------------------------------
// 6. PUSH NOTIFICATIONS — Web Push Receiver & Click Action
// ---------------------------------------------------------------------------
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options: NotificationOptions = {
      body: data.body ?? '',
      icon: data.icon ?? '/icons/192.png',
      badge: '/icons/192.png',
      tag: data.tag,
      data: { url: data.url ?? '/' },
    };
    (options as any).vibrate = [100, 50, 100];
    if (data.actions) {
      (options as any).actions = data.actions;
    }
    if (data.tag) {
      (options as any).renotify = true;
    }
    event.waitUntil(
      self.registration.showNotification(data.title ?? 'Notificação PWA', options),
    );
  } catch {
    // If not json, show plain text
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Notificação PWA', {
        body: text,
        icon: '/icons/192.png',
      }),
    );
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList: readonly Client[]) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client && typeof (client as WindowClient).focus === 'function') {
          return (client as WindowClient).focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

// ---------------------------------------------------------------------------
// 7. MESSAGE PASSING — Client ↔ SW Communication
// ---------------------------------------------------------------------------
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data, ports } = event;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'PING') {
    ports[0]?.postMessage({ type: 'PONG', timestamp: Date.now() });
    return;
  }

  if (data.type === 'GET_QUEUE_STATUS') {
    event.waitUntil(
      (async () => {
        const entries = await mutationQueue.getAll();
        ports[0]?.postMessage({ type: 'QUEUE_STATUS', count: entries.length });
      })(),
    );
    return;
  }

  if (data.type === 'REPLAY_MUTATIONS') {
    event.waitUntil(
      (async () => {
        let replayed = 0;
        let entry;
        while ((entry = await mutationQueue.shiftRequest())) {
          try {
            const res = await fetch(entry.request.clone());
            if (!res.ok) {
              await mutationQueue.unshiftRequest(entry);
              break;
            }
            replayed++;
          } catch {
            await mutationQueue.unshiftRequest(entry);
            break;
          }
        }
        const remaining = (await mutationQueue.getAll()).length;
        await notifyClients({ type: 'SYNC_COMPLETED', remaining });
        ports[0]?.postMessage({ type: 'REPLAY_RESULT', ok: true, replayed, remaining });
      })(),
    );
  }
});

// ---------------------------------------------------------------------------
// 8. PERIODIC SYNC (Optional, supported on Chromium browsers)
// ---------------------------------------------------------------------------
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(notifyClients({ type: 'PERIODIC_REFRESH' }));
  }
});

// ---------------------------------------------------------------------------
// 9. LIFECYCLE — Skip waiting & Claim clients immediately
// ---------------------------------------------------------------------------
self.skipWaiting();
self.clients.claim();
