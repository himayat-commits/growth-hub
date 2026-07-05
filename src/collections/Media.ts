import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Uploads back public site content (partner logos, page imagery). The
    // Vercel Blob plugin serves files through /api/media/file/* with this
    // collection's read access applied — without a public read rule, Payload's
    // default (authenticated-only) 403s every asset for site visitors.
    read: () => true,
  },
  upload: {
    // Local fallback when BLOB_READ_WRITE_TOKEN is not set (development).
    // Vercel Blob plugin overrides the storage destination in production.
    staticDir: 'public/media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
};
