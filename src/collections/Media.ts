import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Uploads back public site content (partner logos, page imagery). The
    // Vercel Blob plugin serves files through /api/media/file/* with this
    // collection's read access applied — without a public read rule, Payload's
    // default (authenticated-only) 403s every asset for site visitors.
    //
    // CAVEAT for gated content: because read is public, ANY file in this
    // collection — including a deck or recording attached to a `free: false`
    // resource — is world-readable at its Blob URL once someone shares the
    // link. The paid-plan gate on /resources hides the link from free
    // members; it does not protect the bytes. True gating needs a
    // `read: () => false` documents collection served through an authed
    // proxy route (out of scope for now).
    read: () => true,
  },
  upload: {
    // Local fallback when BLOB_READ_WRITE_TOKEN is not set (development).
    // Vercel Blob plugin overrides the storage destination in production.
    staticDir: 'public/media',
    // imageSizes only apply to raster images. Payload gates resizing on
    // `canResizeImage(file.mimetype)` (payload/dist/uploads/canResizeImage.js:
    // jpeg/png/gif/webp/tiff/avif) and only calls createImageSizes when that
    // is true (payload/dist/uploads/generateFileData.js, `fileSupportsResize`),
    // so PDFs / MP4s / Office docs are stored as-is with no derived sizes.
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
      // Documents + recordings for the Resources library and event recordings.
      'application/pdf',
      'video/mp4',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
