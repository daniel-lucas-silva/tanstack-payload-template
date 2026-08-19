import type { GlobalConfig } from 'payload';

import { admins } from '../access';

/**
 * Global = documento único (configuração do site). Access pode retornar Where
 * (aqui: usuário anônimo só vê o global se maintenanceMode NÃO estiver ligado).
 */
export const SiteSettings: GlobalConfig = {
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
