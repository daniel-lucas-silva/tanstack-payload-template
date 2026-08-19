import type { CollectionConfig } from 'payload';

import { admins, anyone, isUser } from '../access';

/**
 * Tour pelos tipos de campo + configurações avançadas (defaultValue em 4
 * formas, validate, virtual, filterOptions, unique/index, hasMany).
 */
export const FieldShowcase: CollectionConfig = {
  slug: 'field-showcase',
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    // ── defaultValue: as 4 formas possíveis. ──
    { name: 'staticDefault', type: 'text', defaultValue: 'hi' },
    { name: 'fnDefault', type: 'text', defaultValue: () => 'computed' },
    { name: 'asyncDefault', type: 'text', defaultValue: async () => 'async-computed' },
    {
      name: 'reqDefault',
      type: 'text',
      defaultValue: async ({ req }) => {
        const user = req.user;
        return isUser(user) ? (user.email ?? '') : '';
      },
    },

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
