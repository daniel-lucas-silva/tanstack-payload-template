import type { Endpoint } from 'payload';
import webpush from 'web-push';

// In-memory subscription storage for demonstration / development
const pushSubscriptions = new Map<string, webpush.PushSubscription>();

// Generate or use VAPID keys
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.BUN_PUBLIC_VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  const generated = webpush.generateVAPIDKeys();
  vapidPublicKey = generated.publicKey;
  vapidPrivateKey = generated.privateKey;
}

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    vapidPublicKey,
    vapidPrivateKey,
  );
} catch (err) {
  console.warn('[PWA WebPush] Could not configure VAPID details:', err);
}

export const pwaEndpoints: Endpoint[] = [
  {
    path: '/pwa/vapid-key',
    method: 'get',
    handler: () => {
      return Response.json({
        publicKey: vapidPublicKey,
      });
    },
  },
  {
    path: '/pwa/subscribe',
    method: 'post',
    handler: async (req) => {
      try {
        const body = (await req.json?.()) as webpush.PushSubscription;
        if (!body || !body.endpoint) {
          return Response.json({ error: 'Assinatura inválida' }, { status: 400 });
        }
        pushSubscriptions.set(body.endpoint, body);
        return Response.json({ success: true, count: pushSubscriptions.size });
      } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
      }
    },
  },
  {
    path: '/pwa/unsubscribe',
    method: 'post',
    handler: async (req) => {
      try {
        const { endpoint } = ((await req.json?.()) as { endpoint?: string }) || {};
        if (endpoint) {
          pushSubscriptions.delete(endpoint);
        }
        return Response.json({ success: true, count: pushSubscriptions.size });
      } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
      }
    },
  },
  {
    path: '/pwa/send-test',
    method: 'post',
    handler: async (req) => {
      try {
        const { title, body, url } =
          ((await req.json?.()) as { title?: string; body?: string; url?: string }) || {};

        const payload = JSON.stringify({
          title: title || 'Fullstack PWA Notificação',
          body: body || 'Notificação push enviada pelo backend com sucesso!',
          url: url || '/pwa',
          icon: '/icons/192.png',
        });

        const results: Array<{ endpoint: string; ok: boolean; error?: string }> = [];

        for (const [endpoint, sub] of pushSubscriptions.entries()) {
          try {
            await webpush.sendNotification(sub, payload);
            results.push({ endpoint, ok: true });
          } catch (err: any) {
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              pushSubscriptions.delete(endpoint);
            }
            results.push({ endpoint, ok: false, error: String(err) });
          }
        }

        return Response.json({
          success: true,
          totalSent: results.filter((r) => r.ok).length,
          totalFailed: results.filter((r) => !r.ok).length,
          results,
        });
      } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
      }
    },
  },
];
