import '@/server/bootstrap';
import { serve } from 'bun';
import { handleEndpoints } from 'payload';
import { generateTypes } from 'payload/node';

import index from '@/app/index.html';
import payloadConfig from '@/server/config';

type Routes<WebSocketData = undefined> =
  | Bun.Serve.Routes<WebSocketData, any>
  | Bun.Serve.RoutesWithUpgrade<WebSocketData, any>;

type WSContext = { name: string };

const serverConfig = await payloadConfig;

await generateTypes(serverConfig, { log: true });

const server = Bun.serve<WSContext>({
  reusePort: true,
  port: Number(Bun.env.PORT ?? 3000),
  hostname: '0.0.0.0',
  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
  routes: await buildRoutes<WSContext>(),
  websocket: {
    ping(ws, data) {},
    pong(ws, data) {},
    open(ws) {},
    drain(ws) {},
    message(ws, message) {
      // console.log(ws.data.name, 'says:', message)
    },
    close(ws, code, reason) {},
    sendPings: true,
    publishToSelf: true,
    idleTimeout: 0,
    maxPayloadLength: 104857600,
  },
  error(error) {
    console.log(error);
    return new Response(null, { status: 500 });
  },
});

async function buildRoutes<WebSocketData = undefined>(): Promise<Routes<WebSocketData>> {
  const isProd = process.env.NODE_ENV === 'production';
  const distSwExists = await Bun.file('dist/sw.js').exists();

  const routes: Routes<WebSocketData> = {
    // Service Worker route
    '/sw.js': async () => {
      if (isProd && distSwExists) {
        return new Response(Bun.file('dist/sw.js'), {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }

      // Dev mode: bundle sw.ts on the fly
      try {
        const swBuild = await Bun.build({
          entrypoints: ['app/sw.ts'],
          target: 'browser',
          minify: false,
          define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
          },
        });

        const output = swBuild.outputs[0];
        if (!output) {
          return new Response('console.error("SW build failed");', {
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
          });
        }

        return new Response(await output.text(), {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      } catch (err) {
        console.error('[PWA SW Build Error]', err);
        return new Response(`console.error("SW error: ${String(err)}");`, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        });
      }
    },

    '/manifest.webmanifest': () => {
      return new Response(Bun.file('public/manifest.webmanifest'), {
        headers: { 'Content-Type': 'application/manifest+json' },
      });
    },

    '/offline.html': () => {
      return new Response(Bun.file('public/offline.html'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    },

    // Payload API
    '/api/*': async (request) => {
      return await handleEndpoints({ config: serverConfig, request });
    },

    // Serve index.html for all unmatched routes.
    '/*': index,
  };

  const glob = new Bun.Glob(
    '**/*.{png,jpg,jpeg,gif,svg,css,js,ico,woff,woff2,ttf,eot,mp4,webm,ogg,mp3,wav,aac,flac,m4a,xml,json,webmanifest,html,map}',
  );
  for await (const path of glob.scan({ onlyFiles: true, cwd: './public' })) {
    routes[`/${path}`] = new Response(Bun.file(`./public/${path}`));
  }

  return routes;
}

console.log(`🚀 Server running at ${server.url}`);
