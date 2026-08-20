/**
 * ============================================================================
 *  PAYLOAD CMS — API-ONLY (catálogo de capacidades)
 * ============================================================================
 *
 *  Versão: Payload 3.88.0 (SEM painel admin — só API REST)
 *
 *  Este arquivo é o ponto de MONTAGEM: importa as peças de cada pasta e liga
 *  tudo no `buildConfig`. As peças vivem separadas, um arquivo por responsabilidade:
 *
 *    server/access/       → funções de access reutilizáveis + type guard `isUser`
 *    server/collections/  → um arquivo por collection (users, posts, media…)
 *    server/globals/      → um arquivo por global (site-settings, navigation)
 *    server/endpoints/    → endpoints de raiz (/health, /stats, …)
 *    server/jobs/         → tasks + workflows
 *    server/types.ts      → GERADO (não edite)
 *
 *  É um catálogo de CAPACIDADES, não um schema de domínio: mostra o que o
 *  Payload consegue fazer (access, hooks, jobs, endpoints, auth, fields). Ao
 *  adicionar collection/global/endpoint/job, crie o arquivo na pasta certa e
 *  importe aqui.
 * ============================================================================
 */

import './bootstrap';

import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { resendAdapter } from '@payloadcms/email-resend';
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { gcsStorage } from '@payloadcms/storage-gcs';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { ApiKeys } from './collections/api-keys';
import { Categories } from './collections/categories';
import { Comments } from './collections/comments';
import { FieldShowcase } from './collections/field-showcase';
import { Media } from './collections/media';
import { Posts } from './collections/posts';
import { Tags } from './collections/tags';
import { Users } from './collections/users';
import { getMongoUri } from './db';
import { rootEndpoints } from './endpoints';
import { Navigation } from './globals/navigation';
import { SiteSettings } from './globals/site-settings';
import { echoTask, inlineWorkflow, maintenanceTask, publishWorkflow } from './jobs';

export default buildConfig({
  // Segredo para assinar JWTs/cookies. Nunca hardcode em produção.
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',

  db: mongooseAdapter({ url: await getMongoUri() }),

  // URL pública da API (usada em links, emails, redirects).
  serverURL: process.env.SERVER_URL ?? 'http://localhost:3333',

  // Necessário para redimensionar imagens (imageSizes). Passa o módulo sharp.
  sharp,

  collections: [Users, ApiKeys, Media, Categories, Posts, Tags, Comments, FieldShowcase],
  globals: [SiteSettings, Navigation],
  endpoints: rootEndpoints,

  // PLUGINS: ponto de composição. O MCP expõe as collections como tools MCP
  // para agentes de IA (Claude, Cursor etc.) consultarem o CMS diretamente.
  plugins: [
    mcpPlugin({
      collections: {
        posts: { enabled: true, description: 'Blog posts' },
        users: { enabled: true, description: 'Users' },
      },
    }),
    // STORAGE (Google Cloud Storage): se GCS_BUCKET estiver definido, envia
    // os uploads para a nuvem da Google; caso contrário, usa armazenamento local em disco.
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
  ],

  // Email (obrigatório para verify/forgotPassword). Condicional: sem a key,
  // o config sobe sem adapter de email.
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: 'no-reply@example.com',
        defaultFromName: 'Payload Demo',
      })
    : undefined,

  // Localização: idiomas + fallback + RTL.
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
      { code: 'pt', label: 'Português', fallbackLocale: 'es' },
      { code: 'ar', label: 'العربية', rtl: true },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  // Traduções customizáveis (usadas por labels via `({ t }) => t('general:x')`).
  i18n: { translations: { en: { general: { welcome: 'Welcome' } }, es: { general: { welcome: 'Bienvenido' } } } },

  // GraphQL desligado — API é REST (usada pelo SDK no frontend).
  graphQL: { disable: true },

  cors: ['http://localhost:3000'],
  csrf: ['http://localhost:3000'],

  // Hook global de erro: roda em QUALQUER throw do Payload.
  hooks: {
    afterError: [
      ({ error, req }) => {
        req?.payload?.logger?.error(`[afterError] ${error.message}`);
      },
    ],
  },

  // Tipos gerados (o index.ts chama generateTypes no boot).
  typescript: { outputFile: 'server/types.ts', autoGenerate: true },

  // JOBS: registra tasks e workflows. Para agendar de verdade, adicione:
  //   jobs: { autoRun: [{ cron: '* * * * *', queue: 'default', limit: 100 }] }
  jobs: { tasks: [echoTask, maintenanceTask], workflows: [publishWorkflow, inlineWorkflow] },

  // Seed: cria o primeiro admin no boot (env ADMIN_EMAIL/ADMIN_PASSWORD).
  onInit: async (payload) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return;

    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 });
    if (existing.totalDocs > 0) return;

    await payload.create({
      collection: 'users',
      data: { email, password, username: email, roles: ['admin'] },
      // overrideAccess: true — operação de sistema, ignora o access control.
      overrideAccess: true,
    });
    payload.logger.info('✔ Admin seeded');
  },
});
