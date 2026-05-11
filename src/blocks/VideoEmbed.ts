import type { Block } from 'payload';

export const VideoEmbed: Block = {
  slug: 'video-embed',
  labels: { singular: 'Video Embed', plural: 'Video Embeds' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'YouTube or Vimeo URL.' },
    },
    { name: 'poster', type: 'upload', relationTo: 'media' },
    { name: 'caption', type: 'text' },
  ],
};
