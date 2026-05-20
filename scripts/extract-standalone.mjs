// One-off: extract a single asset (by UUID prefix) from a __bundler-style
// standalone HTML file. Run with:
//   node scripts/extract-standalone.mjs <html-path> <uuid-prefix>
// Prints the asset to stdout (text mimes) or writes /tmp/<uuid> (binary).

import fs from 'node:fs';
import zlib from 'node:zlib';

const [, , htmlPath, prefix] = process.argv;
if (!htmlPath || !prefix) {
  console.error('Usage: node extract-standalone.mjs <html> <uuid-prefix>');
  process.exit(1);
}

const src = fs.readFileSync(htmlPath, 'utf8');
const m = src.match(/<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/);
if (!m) { console.error('manifest not found'); process.exit(1); }
const manifest = JSON.parse(m[1]);

const matches = Object.entries(manifest).filter(([uuid]) => uuid.startsWith(prefix));
if (matches.length === 0) { console.error('no asset matches prefix'); process.exit(1); }

for (const [uuid, entry] of matches) {
  let bytes = Buffer.from(entry.data, 'base64');
  if (entry.compressed) bytes = zlib.gunzipSync(bytes);
  const text = entry.mime.startsWith('text/') || entry.mime.includes('javascript') || entry.mime.includes('json');
  if (text) {
    process.stdout.write(`\n===== ${uuid} (${entry.mime}, ${bytes.length} bytes) =====\n`);
    process.stdout.write(bytes.toString('utf8'));
  } else {
    const dest = `C:/tmp/${uuid}.bin`;
    fs.mkdirSync('C:/tmp', { recursive: true });
    fs.writeFileSync(dest, bytes);
    console.error(`wrote ${dest} (${entry.mime}, ${bytes.length} bytes)`);
  }
}
