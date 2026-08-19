import type { CollectionConfig } from 'payload';

import { slugField } from 'payload';

import { admins, anyone } from '../access';

/**
 * Árvore (parent self-rel) + JOIN field.
 * O `join` é o recurso relacional flagship: ele NÃO guarda dados. Ele calcula,
 * sob demanda, os documentos de OUTRA collection cujo campo `on` aponta para
 * cá. Aqui: todos os posts que têm `category` = esta categoria.
 */
export const Categories: CollectionConfig = {
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
