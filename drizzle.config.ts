import type { Config } from 'drizzle-kit';

export default {
  // src/ prefix required — tsconfig maps @/* to ./src/* in this repo
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  // Prevent drizzle-kit from touching Payload's tables (which live in the 'payload' schema)
  schemaFilter: ['public'],
} satisfies Config;
