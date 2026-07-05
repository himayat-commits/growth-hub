import { getPayload } from 'payload';
import config from '../src/payload.config';

async function run() {
  const payload = await getPayload({ config });
  const media = await payload.find({ collection: 'media', limit: 100, depth: 0 });
  console.log(`media rows: ${media.totalDocs}`);
  for (const m of media.docs) {
    console.log(`- id=${m.id} filename=${m.filename} url=${m.url} alt=${m.alt}`);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
