/**
 * One-off: create a Payload CMS admin user.
 *
 * Run with:
 *   node --env-file=.env.local --import tsx/esm scripts/create-payload-admin.ts \
 *     "nash@whatworks.com.au" "Nash Khanal" "<password>"
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const [, , email, name, password] = process.argv;

if (!email || !name || !password) {
  console.error('Usage: create-payload-admin.ts <email> <name> <password>');
  process.exit(1);
}

const payload = await getPayload({ config });

// Skip if a user already exists with this email.
const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
});

if (existing.totalDocs > 0) {
  console.log(`User already exists: ${email} (id=${existing.docs[0]?.id})`);
  process.exit(0);
}

const user = await payload.create({
  collection: 'users',
  data: { email, name, password },
});

console.log(`Created Payload admin: id=${user.id}, email=${user.email}`);
process.exit(0);
