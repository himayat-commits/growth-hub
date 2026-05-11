import type { CollectionConfig } from 'payload';

// CMS administrator accounts — completely separate from Clerk user accounts.
// Payload's built-in auth (email + password + JWT) is enabled via auth: true.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
};
