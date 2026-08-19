import type { CollectionConfig } from 'payload';

import { slugField } from 'payload';

import { admins, anyone } from '../access';

/**
 * `orderable: true` cria o campo `_order` (índice fracionário) + endpoint
 * POST /reorder para reordenar sem reescrever tudo. O join aqui é o REVERSO:
 * todos os posts que têm esta tag (hasMany).
 */
export const Tags: CollectionConfig = {
  slug: 'tags',
  orderable: true,
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'label', type: 'text', required: true },
    slugField({ useAsSlug: 'label' }),
    { name: 'posts', type: 'join', collection: 'posts', on: 'tags' },
  ],
};
