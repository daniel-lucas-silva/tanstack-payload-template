import type { GlobalConfig } from 'payload';

import { admins, anyone } from '../access';

/** Global simples: array localizado + relacionamento. */
export const Navigation: GlobalConfig = {
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
