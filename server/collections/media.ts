import type { CollectionConfig } from 'payload';

import { admins, anyone, authenticated } from '../access';

/**
 * Upload com tamanhos derivados (sharp), foco e MIME permitido. O armazenamento
 * real (Vercel Blob) é ligado no `plugins:` do buildConfig.
 */
export const Media: CollectionConfig = {
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
