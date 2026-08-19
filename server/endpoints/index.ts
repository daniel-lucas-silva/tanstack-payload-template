import type { Endpoint } from 'payload';

/**
 * Endpoints de RAIZ: montam em /api/<path>.
 * Dentro do handler, `req.payload` é a instância do Payload (Local API),
 * `req.routeParams` são os parâmetros da URL, e `await req.json()` lê o body.
 */
export const rootEndpoints: Endpoint[] = [
  // Healthcheck simples.
  { path: '/health', method: 'get', handler: () => Response.json({ status: 'ok' }) },
  // Local API dentro de endpoint.
  {
    path: '/stats',
    method: 'get',
    handler: async (req) => {
      const [users, posts] = await Promise.all([
        req.payload.count({ collection: 'users' }),
        req.payload.count({ collection: 'posts' }),
      ]);
      return Response.json({ users: users.totalDocs, posts: posts.totalDocs });
    },
  },
  // Lê o body JSON do request.
  { path: '/echo', method: 'post', handler: async (req) => Response.json(await req.json?.()) },
  // KV: armazenamento chave/valor (adapter padrão = banco).
  {
    path: '/kv-demo',
    method: 'get',
    handler: async (req) => {
      await req.payload.kv.set('demo-key', { at: new Date().toISOString() });
      const value = await req.payload.kv.get('demo-key');
      return Response.json({ value });
    },
  },
];
