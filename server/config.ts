/**
 * ============================================================================
 *  PAYLOAD CMS — CATÁLOGO DE CAPACIDADES (API-ONLY)
 * ============================================================================
 *
 *  Versão: Payload 4.0.0-canary.28 (SEM painel admin — só API REST)
 *
 *  Este arquivo é uma referência de geração de código para agentes de IA.
 *  Ele mostra o que o Payload CONSEGUE fazer, não um schema de domínio a ser
 *  copiado. O básico (text, number, checkbox…) aparece sem comentário — é
 *  óbvio. Todo o espaço de explicação vai para o que um agente normalmente
 *  NÃO usa por conta própria: access control, hooks, jobs e configurações
 *  avançadas de field. A ideia é que o agente se planeje para isso DESDE o
 *  início, em vez de descobrir depois.
 *
 *  ÍNDICE:
 *   §1  Imports
 *   §2  Access control reutilizável (boolean + Where row-level)
 *   §3  Collections (users, api-keys, media, categories, posts, tags,
 *       comments, field-showcase)
 *   §4  Globals (site-settings, navigation)
 *   §5  Endpoints customizados (root / collection / global)
 *   §6  Jobs (tasks + workflows + agendamento)
 *   §7  buildConfig — liga tudo
 *
 *  NOTAS DE ESCOPO (API-only):
 *  - Sem `admin.*`, sem richText, sem UI field (são coisas de painel).
 *  - richText exige `@payloadcms/richtext-lexical` + `editor:` no config — fora.
 * ============================================================================
 */

// §1 ─── IMPORTS ───────────────────────────────────────────────────────────────
import type {
  Access,
  AuthStrategyFunction,
  CollectionConfig,
  Endpoint,
  FieldAccess,
  GlobalConfig,
  PayloadRequest,
  TaskConfig,
  Where,
  WorkflowConfig,
} from 'payload';

import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { resendAdapter } from '@payloadcms/email-resend';
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import { APIError, buildConfig, slugField } from 'payload';
import sharp from 'sharp';

import type { ApiKey, User } from './types';

// §2 ─── ACCESS CONTROL REUTILIZÁVEL ──────────────────────────────────────────
//
// Uma função de access pode retornar TRÊS coisas:
//   1. `true`  — permite
//   2. `false` — nega
//   3. um objeto `Where` — restrição a nível de LINHA. O Payload faz MERGE
//      dessa query na consulta, então o usuário só vê/edita os documentos que
//      batem com a restrição. É assim que se faz multi-tenancy / "só o seu".
//
// Extrair em constantes reutilizáveis evita repetir a mesma lógica em cada
// collection. Anote com o tipo `Access` (senão o TS alarga o literal).

// Quando há MAIS de uma collection auth, `req.user` é uma UNIÃO discriminada
// por `collection` ('users' | 'api-keys' | a que o MCP injeta). Narrow pelo
// literal para acessar campos que só existem em uma delas (ex.: `roles`).
const asUser = (user: PayloadRequest['user']): User | null => (user?.collection === 'users' ? user : null);

const anyone: Access = () => true;

const authenticated: Access = ({ req }) => Boolean(req.user);

const admins: Access = ({ req }) => Boolean(asUser(req.user)?.roles?.includes('admin'));

// Row-level: o usuário vê TUDO se for admin; senão, só os próprios docs.
const selfOrAdmin: Access = ({ req }) => {
  const user = asUser(req.user);
  if (!user) return false;
  if (user.roles?.includes('admin')) return true;
  return { id: { equals: user.id } };
};

// Combinador `and`: restrição composta (draft + autoria), ou admin libera tudo.
const authorCanEditDrafts: Access = ({ req }) => {
  const user = asUser(req.user);
  if (!user) return false;
  if (user.roles?.includes('admin')) return true;
  const where: Where = { and: [{ status: { equals: 'draft' } }, { author: { equals: user.id } }] };
  return where;
};

// Leitura pública vs. autenticada: anônimo só vê publicado, logado vê tudo.
const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true;
  return { status: { equals: 'published' } };
};

// Field-level access: SÓ retorna boolean (nunca Where).
const adminOnlyField: FieldAccess = ({ req }) => Boolean(asUser(req.user)?.roles?.includes('admin'));

// Estratégia de autenticação customizada: loga com um header `x-legacy-key`
// em vez de senha. Útil para SSO, tokens de terceiros, magic links etc.
// Roda AO LADO da estratégia local (email/senha); para SUBSTITUÍ-la, use
// `auth.disableLocalStrategy: true`.
const legacyKeyStrategy: AuthStrategyFunction = async ({ headers, payload }) => {
  const key = headers.get('x-legacy-key');
  if (!key) return { user: null };
  const { docs } = await payload.find({ collection: 'users', where: { legacyKey: { equals: key } }, limit: 1 });
  const user = docs[0] ?? null;
  if (!user) return { user: null };
  return {
    // `_strategy` identifica qual estratégia autenticou (aparece em /me).
    user: { ...user, _strategy: 'users-legacy-key' },
    // Headers extras devolvidos na resposta HTTP.
    responseHeaders: new Headers({ 'X-Auth-Strategy': 'legacy-key' }),
  };
};

// §3 ─── COLLECTIONS ───────────────────────────────────────────────────────────

// ─── users ────────────────────────────────────────────────────────────────────
// A collection de auth "tudo ligado": estratégia customizada, API keys,
// lockout, expiração de token, login por username, saveToJWT e field access.
const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Login por username (além de email). As 3 combinações possíveis:
    //   { requireEmail: true,  allowEmailLogin: false } — email obrigatório
    //   { requireEmail: false, allowEmailLogin: true  } — email OU username
    //   { requireEmail: false, allowEmailLogin: false } — só username
    loginWithUsername: { requireEmail: true, allowEmailLogin: true },
    // Lockout: após N tentativas falhas, bloqueia por lockTime ms.
    maxLoginAttempts: 5,
    lockTime: 5 * 60 * 1000,
    // Quanto tempo o JWT vale (segundos).
    tokenExpiration: 7200,
    // Gera chaves de API por usuário (header `Authorization: users API-Key <key>`).
    useAPIKey: true,
    // Sessões server-side (revogáveis), com claim `sid` no JWT.
    useSessions: true,
    // Não devolve o token no corpo das respostas (só cookie/header).
    removeTokenFromResponses: true,
    // Estratégia customizada, AO LADO da local.
    strategies: [{ name: 'legacy-key', authenticate: legacyKeyStrategy }],
    // Verificação de email e reset de senha exigem `email:` (adapter) no
    // buildConfig — descomente quando tiver o RESEND_API_KEY:
    // verify: true,
    // forgotPassword: { expiration: 60 * 60 * 1000 },
  },
  access: {
    // `admin` controla quem pode ENTRAR no painel (aqui irrelevante, mas
    // demonstra o tipo). Recebe `{ slug, req }`.
    admin: ({ req }) => Boolean(asUser(req.user)?.roles?.includes('admin')),
    create: () => true, // registro aberto
    read: authenticated,
    update: selfOrAdmin,
    delete: admins,
    // `unlock` decide quem pode desbloquear uma conta. Aqui: só a si mesmo.
    unlock: ({ req }) => {
      const user = asUser(req.user);
      if (!user) return false;
      return { id: { equals: user.id } };
    },
  },
  fields: [
    { name: 'name', type: 'text' },
    // `saveToJWT` grava o campo DENTRO do token, evitando um lookup no banco
    // a cada request. Funciona com select/hasMany e dentro de group/tab.
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'viewer'],
      defaultValue: ['viewer'],
      saveToJWT: true,
    },
    // Field-level access: campo visível/gravável só por admin.
    // Aplica-se a TODA leitura do doc (find, findByID, /me, JWT).
    { name: 'salary', type: 'number', access: { read: adminOnlyField, update: adminOnlyField } },
    // Campo usado pela estratégia customizada acima.
    { name: 'legacyKey', type: 'text', unique: true },
  ],
};

// ─── api-keys ────────────────────────────────────────────────────────────────
// Collection "machine-to-machine": sem login local, só API keys.
// `disableLocalStrategy: true` remove o login por email/senha; cada doc vira
// uma credencial de serviço. O `read` é auto-escopado: uma key só enxerga a si.
const ApiKeys: CollectionConfig = {
  slug: 'api-keys',
  auth: { disableLocalStrategy: true, useAPIKey: true },
  access: {
    read: ({ req }) => {
      const user = req.user;
      if (!user) return false;
      if (user.collection === 'api-keys') return { id: { equals: user.id } };
      return true; // admins/users do sistema enxergam tudo
    },
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [{ name: 'label', type: 'text' }],
};

// ─── media ───────────────────────────────────────────────────────────────────
// Upload com tamanhos derivados (sharp), foco e MIME permitido. O armazenamento
// real (Vercel Blob) é ligado no `storage:` do buildConfig.
const Media: CollectionConfig = {
  slug: 'media',
  access: { read: anyone, create: authenticated, update: authenticated, delete: admins },
  upload: {
    // Diretório local de fallback (quando o adapter de storage não é usado).
    staticDir: 'media',
    // Gera versões redimensionadas automaticamente no upload.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, crop: 'center' },
      { name: 'card', width: 768, height: 1024, crop: 'center' },
      { name: 'hero', width: 1920, height: 1080, crop: 'center' },
    ],
    adminThumbnail: 'thumbnail',
    // Guarda coordenadas do ponto focal (recorte inteligente).
    focalPoint: true,
    mimeTypes: ['image/*'],
  },
  fields: [{ name: 'alt', type: 'text' }],
};

// ─── categories ──────────────────────────────────────────────────────────────
// Árvore (parent self-rel) + JOIN field.
// O `join` é o recurso relacional flagship: ele NÃO guarda dados. Ele calcula,
// sob demanda, os documentos de OUTRA collection cujo campo `on` aponta para
// cá. Aqui: todos os posts que têm `category` = esta categoria.
const Categories: CollectionConfig = {
  slug: 'categories',
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'name', type: 'text', required: true },
    // 3.88: slug é um HELPER (slugField), não um field type. Gera sozinho.
    slugField({ useAsSlug: 'name' }),
    // Árvore: relacionamento para si mesmo.
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    {
      name: 'posts',
      type: 'join',
      collection: 'posts',
      on: 'category',
      // Restringe os posts que entram no join.
      where: { status: { equals: 'published' } },
      // Ordenação e limite padrão do join.
      defaultSort: '-publishedAt',
      defaultLimit: 10,
      // Profundidade de população dos docs retornados.
      maxDepth: 1,
    },
  ],
};

// ─── posts ───────────────────────────────────────────────────────────────────
// A collection "potência": drafts, trash, TODOS os hooks, endpoints próprios e
// access row-level. É aqui que um agente aprende o padrão completo.
const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: true }, // drafts: cada save vira versão, publish é separado
  trash: true, // delete vira soft-delete (campo deletedAt)
  defaultSort: '-publishedAt',
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authorCanEditDrafts,
    delete: admins,
    // readVersions controla quem vê o histórico de versões.
    readVersions: admins,
  },
  hooks: {
    // ── beforeValidate: formatar/normalizar ANTES da validação. ──
    beforeValidate: [
      ({ data }) => {
        if (data?.title) data.title = data.title.trim();
        return data;
      },
    ],
    // ── beforeChange: regra de negócio antes de gravar. ──
    beforeChange: [
      ({ data, operation, req }) => {
        // Seta o autor automaticamente na criação.
        if (operation === 'create' && req.user) {
          data.author = req.user.id;
        }
        return data;
      },
    ],
    // ── afterChange: efeitos colaterais PÓS-gravação. ──
    // Perigo: chamar `req.payload.update` aqui re-dispara afterChange → loop.
    // O guard `context.triggerAfterChange === false` quebra o ciclo, e o
    // `context` é re-enfiado na operação aninhada (mantém a transação).
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.triggerAfterChange === false) return doc;
        if (doc.status === 'published') {
          await req.payload.update({
            collection: 'posts',
            id: doc.id,
            data: { publishedAt: new Date().toISOString() },
            context: { triggerAfterChange: false },
            req, // ← passar req mantém a MESMA transação
          });
        }
        return doc;
      },
    ],
    // ── afterRead: enriquece o doc na SAÍDA (find/findByID). ──
    afterRead: [
      ({ doc }) => {
        // Campo computado: não está no banco, só na resposta.
        return { ...doc, readingTimeMinutes: Math.ceil((doc?.title?.length ?? 0) / 200) };
      },
    ],
    // ── beforeDelete: bloquear/exigir condição antes de apagar. ──
    // Obs.: beforeDelete NÃO recebe `doc` — busque se precisar dele.
    beforeDelete: [
      async ({ id, req }) => {
        const post = await req.payload.findByID({ collection: 'posts', id });
        if (post?.status === 'published') {
          throw new APIError('Unpublish before deleting.', 400);
        }
      },
    ],
    // ── afterDelete: limpeza em cascata manual (o doc acabou de sumir). ──
    afterDelete: [
      async ({ doc, req }) => {
        await req.payload.delete({ collection: 'comments', where: { target: { equals: doc.id } }, req });
      },
    ],
    // ── beforeOperation: intercepta QUALQUER operação. ──
    // Pode reescrever os `args` (ex.: forçar um filtro) antes de executar.
    beforeOperation: [
      ({ operation, args }) => {
        // Ex.: if (operation === 'read') args.where = { ...args.where, status: { equals: 'published' } }
        return args;
      },
    ],
  },
  // ── Endpoints próprios da collection (montam em /api/posts/...). ──
  endpoints: [
    {
      path: '/:id/publish',
      method: 'post',
      handler: async (req) => {
        const id = String(req.routeParams?.id);
        const updated = await req.payload.update({ collection: 'posts', id, data: { status: 'published' } });
        return Response.json(updated);
      },
    },
    {
      path: '/:id/stats',
      method: 'get',
      handler: async (req) => {
        const id = String(req.routeParams?.id);
        const post = await req.payload.findByID({ collection: 'posts', id });
        return Response.json({ id: post.id, titleLength: post.title?.length ?? 0 });
      },
    },
  ],
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField({ useAsSlug: 'title' }),
    { name: 'status', type: 'select', options: ['draft', 'published'], defaultValue: 'draft', index: true },
    { name: 'excerpt', type: 'textarea' },
    // date com timezone: guarda o fuso de quem publicou.
    { name: 'publishedAt', type: 'date', timezone: true },
    // `hasMany` em escalar (lista de strings).
    { name: 'keywords', type: 'text', hasMany: true },
    { name: 'featured', type: 'checkbox' },
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
      // `validate` custom: retorna `true` ou uma mensagem de erro.
      validate: (value: number | number[] | null | undefined) =>
        typeof value === 'number' && value <= 3 ? 'Rating must be above 3 to be featured' : true,
    },
    // Relacionamentos: simples, hasMany e polimórfico.
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true },
    { name: 'relatedMedia', type: 'relationship', relationTo: ['media'], hasMany: true },
    // upload field aponta para a collection media.
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    // group: sub-objeto estruturado.
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
    // array: lista de sub-docs (com ID próprio).
    {
      name: 'faq',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea' },
      ],
    },
    // blocks: lista de blocos TIPADOS (cada um com schema próprio).
    {
      name: 'content',
      type: 'blocks',
      blocks: [
        { slug: 'paragraph', fields: [{ name: 'text', type: 'textarea' }] },
        {
          slug: 'quote',
          interfaceName: 'QuoteBlock', // gera interface própria nos types
          fields: [
            { name: 'text', type: 'textarea', required: true },
            { name: 'attribution', type: 'text' },
          ],
        },
        { slug: 'embed', fields: [{ name: 'url', type: 'text' }] },
      ],
    },
    { name: 'location', type: 'point' }, // [lng, lat]
    { name: 'snippet', type: 'code' },
    // JSON: aceita qualquer objeto. (`jsonSchema` é recurso do editor — fora.)
    { name: 'metadata', type: 'json' },
    // Virtual (computed) field: copia o valor de outro path sem gravar no banco.
    { name: 'authorName', type: 'text', virtual: 'author.name' },
  ],
};

// ─── tags ────────────────────────────────────────────────────────────────────
// `orderable: true` cria o campo `_order` (índice fracionário) + endpoint
// POST /reorder para reordenar sem reescrever tudo. O join aqui é o REVERSO:
// todos os posts que têm esta tag (hasMany).
const Tags: CollectionConfig = {
  slug: 'tags',
  orderable: true,
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'label', type: 'text', required: true },
    slugField({ useAsSlug: 'label' }),
    { name: 'posts', type: 'join', collection: 'posts', on: 'tags' },
  ],
};

// ─── comments ────────────────────────────────────────────────────────────────
// Relacionamento POLIMÓRFICO (comenta posts OU outros comments = threads),
// campo virtual e field access.
const Comments: CollectionConfig = {
  slug: 'comments',
  access: {
    read: anyone,
    create: authenticated,
    // Row-level: autor edita o próprio comentário; admin edita tudo.
    update: ({ req }) => {
      const user = asUser(req.user);
      if (!user) return false;
      if (user.roles?.includes('admin')) return true;
      return { author: { equals: user.id } };
    },
    delete: admins,
  },
  fields: [
    { name: 'author', type: 'relationship', relationTo: 'users' },
    // Polimórfico: `relationTo` pode ser uma LISTA de collections.
    { name: 'target', type: 'relationship', relationTo: ['posts', 'comments'] },
    { name: 'body', type: 'textarea', required: true },
    // Virtual: puxa o email do autor na leitura (não fica no doc do comment).
    { name: 'authorEmail', type: 'text', virtual: 'author.email' },
    // Field access: campo interno, invisível para quem não é admin.
    { name: 'moderationNote', type: 'textarea', access: { read: adminOnlyField, update: adminOnlyField } },
  ],
};

// ─── field-showcase ──────────────────────────────────────────────────────────
// Tour pelos tipos de campo + configurações avançadas (defaultValue em 4
// formas, validate, virtual, filterOptions, unique/index, hasMany).
const FieldShowcase: CollectionConfig = {
  slug: 'field-showcase',
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    // ── defaultValue: as 4 formas possíveis. ──
    { name: 'staticDefault', type: 'text', defaultValue: 'hi' },
    { name: 'fnDefault', type: 'text', defaultValue: () => 'computed' },
    { name: 'asyncDefault', type: 'text', defaultValue: async () => 'async-computed' },
    { name: 'reqDefault', type: 'text', defaultValue: async ({ req }) => asUser(req.user)?.email ?? '' },

    { name: 'email', type: 'email' },
    { name: 'counter', type: 'number', min: 0, max: 100 },
    // hasMany numérico.
    { name: 'scores', type: 'number', hasMany: true },
    {
      name: 'toggle',
      type: 'checkbox',
      // checkbox: `required` NÃO falha em false; use `validate` se precisar.
      validate: (value: boolean | null | undefined) => (value ? true : 'This field is required.'),
    },
    {
      name: 'category',
      type: 'select',
      options: ['news', 'tutorial', 'release'],
      // filterOptions em SELECT: filtra as opções por estado do doc (sync)…
      filterOptions: ({ options, data }) =>
        data?.hideNews ? options.filter((o) => (typeof o === 'string' ? o : o.value) !== 'news') : options,
    },
    { name: 'priority', type: 'select', options: ['low', 'medium', 'high'] },
    {
      name: 'layout',
      type: 'radio',
      options: [
        { label: 'One column', value: 'one' },
        { label: 'Two columns', value: 'two' },
      ],
      defaultValue: 'one',
    },
    // Relacionamento com filterOptions como FUNÇÃO — pode ser ASYNC (ex.: busca
    // no banco) e retorna Where | boolean. (Em SELECT, filterOptions é só sync.)
    {
      name: 'linkedPost',
      type: 'relationship',
      relationTo: 'posts',
      filterOptions: async ({ data, req }) => {
        const { totalDocs } = await req.payload.count({ collection: 'posts' });
        if (totalDocs === 0) return false;
        return { status: { equals: data?.featured ? 'published' : 'draft' } };
      },
    },
    // Polimórfico.
    { name: 'attachment', type: 'relationship', relationTo: ['media', 'posts'] },
    // row: layout inline de campos.
    {
      type: 'row',
      fields: [
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
      ],
    },
    // collapsible: grupo recolhível.
    { type: 'collapsible', label: 'Advanced', fields: [{ name: 'internalId', type: 'text', unique: true }] },
    // tabs (nomeadas) agrupam campos em abas.
    {
      type: 'tabs',
      tabs: [
        { label: 'Content', fields: [{ name: 'summary', type: 'textarea' }] },
        { label: 'Settings', fields: [{ name: 'sticky', type: 'checkbox' }] },
      ],
    },
    // Virtual computado: não grava, só retorna.
    { name: 'slugPreview', type: 'text', virtual: 'staticDefault' },
  ],
};

// §4 ─── GLOBALS ──────────────────────────────────────────────────────────────

// Global = documento único (configuração do site). Access pode retornar Where
// (aqui: usuário só vê o global se maintenanceMode NÃO estiver ligado).
const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return { maintenanceMode: { not_equals: true } };
    },
    update: admins,
  },
  hooks: {
    // Global hooks recebem `global` (o config sanitizado) no lugar de `collection`.
    beforeChange: [
      ({ data, global }) => {
        data.lastEditedBy = global?.slug ?? null;
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // Efeito colateral: guarda a última edição no KV (adapter = banco).
        await req.payload.kv.set('site-settings:updatedAt', doc.updatedAt);
        return doc;
      },
    ],
  },
  // Endpoint do global (monta em /api/globals/site-settings/export).
  endpoints: [
    {
      path: '/export',
      method: 'get',
      handler: async (req) => {
        const global = await req.payload.findGlobal({ slug: 'site-settings' });
        return Response.json(global);
      },
    },
  ],
  fields: [
    { name: 'siteName', type: 'text', required: true, localized: true },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'maintenanceMode', type: 'checkbox', defaultValue: false },
    // array localizado em global.
    { name: 'announcements', type: 'array', localized: true, fields: [{ name: 'message', type: 'text' }] },
  ],
};

// Global simples: array localizado + relacionamento.
const Navigation: GlobalConfig = {
  slug: 'navigation',
  access: { read: anyone, update: admins },
  fields: [
    {
      name: 'items',
      type: 'array',
      localized: true,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text' },
        { name: 'page', type: 'relationship', relationTo: 'posts' },
      ],
    },
  ],
};

// §5 ─── ENDPOINTS DE RAIZ ────────────────────────────────────────────────────

const rootEndpoints: Endpoint[] = [
  // Healthcheck simples.
  { path: '/health', method: 'get', handler: () => Response.json({ status: 'ok' }) },
  // Local API dentro de endpoint: `req.payload` é a instância do Payload.
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

// §6 ─── JOBS ─────────────────────────────────────────────────────────────────

// Task: unidade de trabalho assíncrona. `inputSchema`/`outputSchema` geram
// tipos; `retries` define a política de retry (backoff exponencial). O generic
// tipa `input`/`output` dentro do handler.
const echoTask: TaskConfig<{
  input: { message: string; failOnce?: boolean };
  output: { echoed: string; processedAt: string };
}> = {
  slug: 'echoTask',
  inputSchema: [
    { name: 'message', type: 'text', required: true },
    { name: 'failOnce', type: 'checkbox', defaultValue: false },
  ],
  outputSchema: [
    { name: 'echoed', type: 'text' },
    { name: 'processedAt', type: 'date' },
  ],
  retries: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
  handler: async ({ input }) => {
    // Erro = throw (o job re-tenta conforme `retries`). Sucesso = { output }.
    if (input.failOnce) {
      throw new Error('simulated failure');
    }
    return { output: { echoed: input.message, processedAt: new Date().toISOString() } };
  },
};

// Task agendada (cron). Só roda de fato se `jobs.autoRun` estiver ligado.
const maintenanceTask: TaskConfig = {
  slug: 'maintenanceTask',
  schedule: [
    {
      cron: '0 0 * * *', // diário à meia-noite
      queue: 'maintenance',
      // hooks de agendamento (antes/depois de disparar o job):
      // hooks: { beforeSchedule: ..., afterSchedule: ... }
    },
  ],
  handler: async ({ req }) => {
    const { totalDocs } = await req.payload.count({ collection: 'posts' });
    return { output: { totalDocs } };
  },
};

// Workflow estilo 1: encadeia tasks nomeadas e lê o resultado de cada passo
// em `job.taskStatus.<slug>.<id>.output`. (output fica tipado após generate:types)
const publishWorkflow: WorkflowConfig<{ post: string | number }> = {
  slug: 'publishWorkflow',
  inputSchema: [{ name: 'post', type: 'relationship', relationTo: 'posts' }],
  handler: async ({ job, tasks }) => {
    await tasks.echoTask('step-1', { input: { message: `processing ${job.input.post}` } });
    const echoed = (job.taskStatus?.echoTask?.['step-1']?.output as { echoed?: string } | undefined)?.echoed ?? '';
    await tasks.echoTask('step-2', { input: { message: `step-1 said: ${echoed}` } });
  },
};

// Workflow estilo 2: `inlineTask` define a task DENTRO do próprio workflow,
// sem precisar de um TaskConfig separado (ótimo para passos descartáveis).
const inlineWorkflow: WorkflowConfig<{ message: string }> = {
  slug: 'inlineWorkflow',
  inputSchema: [{ name: 'message', type: 'text' }],
  handler: async ({ job, inlineTask }) => {
    const result = await inlineTask('step-a', {
      task: async ({ input }) => ({ output: { upper: input.message.toUpperCase() } }),
      input: { message: job.input.message },
    });
    await inlineTask('step-b', {
      task: async ({ input }) => ({ output: { length: input.message.length, first: result.upper } }),
      input: { message: job.input.message },
    });
  },
};

// §7 ─── BUILDCONFIG ───────────────────────────────────────────────────────────

export default buildConfig({
  // Segredo para assinar JWTs/cookies. Nunca hardcode em produção.
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',

  db: mongooseAdapter({ url: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1/fullstack-payload-examples' }),

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
    // STORAGE: no v4, adapters de storage entram AQUI (não em plugins).
    // O token vem do env; sem ele, o adapter desabilita e usa o disco local.
    vercelBlobStorage({ collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN }),
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
