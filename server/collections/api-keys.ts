import type { CollectionConfig } from 'payload';

import { admins } from '../access';

/**
 * Collection "machine-to-machine": sem login local, só API keys.
 * `disableLocalStrategy: true` remove o login por email/senha; cada doc vira
 * uma credencial de serviço. O `read` é auto-escopado: uma key só enxerga a si.
 */
export const ApiKeys: CollectionConfig = {
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
