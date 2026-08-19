import type { CollectionConfig } from 'payload';

import { adminOnlyField, admins, anyone, authenticated, isUser } from '../access';

/**
 * Relacionamento POLIMÓRFICO (comenta posts OU outros comments = threads),
 * campo virtual e field access.
 */
export const Comments: CollectionConfig = {
  slug: 'comments',
  access: {
    read: anyone,
    create: authenticated,
    // Row-level: autor edita o próprio comentário; admin edita tudo.
    update: ({ req }) => {
      const user = req.user;
      if (!isUser(user)) return false;
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
