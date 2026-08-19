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
  const routes: Routes<WebSocketData> = {
    // Serve index.html for all unmatched routes.
    '/*': index,
    '/api/*': async (request) => {
      return await handleEndpoints({ config: serverConfig, request });
    },
    // '/api/hello': {
    //   async GET(req) {
    //     return Response.json({ message: 'Hello, world!', method: 'GET' });
    //   },
    //   async PUT(req) {
    //     return Response.json({ message: 'Hello, world!', method: 'PUT' });
    //   },
    // },
  };

  const glob = new Bun.Glob(
    '**/*.{png,jpg,jpeg,gif,svg,css,js,ico,woff,woff2,ttf,eot,mp4,webm,ogg,mp3,wav,aac,flac,m4a,xml,json,map}',
  );
  for await (const path of glob.scan({ onlyFiles: true, cwd: './public' })) {
    routes[`/${path}`] = new Response(Bun.file(`./public/${path}`));
  }

  return routes;
}

console.log(`🚀 Server running at ${server.url}`);
