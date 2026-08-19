import type { CollectionConfig } from 'payload';

import { APIError, slugField } from 'payload';

import { admins, authenticated, authorCanEditDrafts, publishedOrAuthenticated } from '../access';

/**
 * A collection "potência": drafts, trash, TODOS os hooks, endpoints próprios e
 * access row-level. É aqui que um agente aprende o padrão completo.
 */
export const Posts: CollectionConfig = {
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
