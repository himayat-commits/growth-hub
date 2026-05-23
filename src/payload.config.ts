import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import { resendAdapter } from '@payloadcms/email-resend';
import sharp from 'sharp';
import path from 'path';

// payload.config.ts is loaded by the Payload CLI via tsx's CJS register path,
// so we cannot use import.meta.url here. process.cwd() is the project root when
// the CLI is invoked from the growth-hub/ directory (e.g. npm run payload:migrate).
const cwd = process.cwd();

// On Vercel preview deployments NEXT_PUBLIC_SITE_URL points to the production
// domain which may not exist yet, so the admin panel would POST logins to the
// wrong host. On any non-production Vercel deployment use VERCEL_URL (the
// deployment-specific hostname Vercel always sets) so admin API calls stay on
// the correct origin.
const serverURL =
  process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

// Collections
import { Users } from './collections/Users.ts';
import { Pages } from './collections/Pages.ts';
import { Posts } from './collections/Posts.ts';
import { CaseStudies } from './collections/CaseStudies.ts';
import { Testimonials } from './collections/Testimonials.ts';
import { FAQs } from './collections/FAQs.ts';
import { TeamMembers } from './collections/TeamMembers.ts';
import { Media } from './collections/Media.ts';
import { Logos } from './collections/Logos.ts';
import { Partners } from './collections/Partners.ts';
import { Events } from './collections/Events.ts';
import { Resources } from './collections/Resources.ts';
import { Services } from './collections/Services.ts';
import { Strategists } from './collections/Strategists.ts';

// Globals
import { SiteSettings } from './globals/SiteSettings.ts';
import { Navigation } from './globals/Navigation.ts';
import { AnnouncementBar } from './globals/AnnouncementBar.ts';
import { SignupPageContent } from './globals/SignupPageContent.ts';
import { PartnersPage } from './globals/PartnersPage.ts';

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(cwd, 'src'),
    },
  },

  collections: [
    Users,
    Pages,
    Posts,
    CaseStudies,
    Testimonials,
    FAQs,
    TeamMembers,
    Media,
    Logos,
    Partners,
    Events,
    Resources,
    Services,
    Strategists,
  ],

  globals: [
    SiteSettings,
    Navigation,
    AnnouncementBar,
    SignupPageContent,
    PartnersPage,
  ],

  editor: lexicalEditor({}),

  sharp,

  secret: process.env.PAYLOAD_SECRET!,

  typescript: {
    outputFile: path.resolve(cwd, 'src/payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL!,
    },
    // Keep Payload's tables in the 'payload' schema — isolated from
    // Drizzle's 'subscriptions' table in the public schema.
    schemaName: 'payload',
  }),

  email: resendAdapter({
    defaultFromAddress: 'noreply@himayat.com.au',
    defaultFromName: 'Growth Hub',
    apiKey: process.env.RESEND_API_KEY!,
  }),

  plugins: [
    vercelBlobStorage({
      // Disabled locally when BLOB_READ_WRITE_TOKEN is not set — falls back to disk.
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
      collections: {
        media: true,
      },
    }),
  ],

  // Used for CSRF protection and generating absolute URLs in hooks.
  serverURL,

  cors: [
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    // Allow the deployment URL on preview so admin login works before
    // the production domain is configured.
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
});
