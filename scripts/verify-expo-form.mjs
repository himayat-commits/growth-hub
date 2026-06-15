// Read-only: fetches the live Expo form definition via the Private App /
// Service Key token and prints every field's internal name + type, so we can
// confirm src/app/api/expo-apply/route.ts submits names the form accepts.
// Run:  node scripts/verify-expo-form.mjs
import { readFileSync } from 'node:fs';

// Pull HUBSPOT_PRIVATE_APP_TOKEN + form id straight from .env.local.
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const TOKEN = env.HUBSPOT_PRIVATE_APP_TOKEN;
const FORM_ID = env.NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID;
if (!TOKEN || !FORM_ID) {
  console.error('Missing HUBSPOT_PRIVATE_APP_TOKEN or NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID in .env.local');
  process.exit(1);
}

const res = await fetch(`https://api.hubapi.com/marketing/v3/forms/${FORM_ID}`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const json = await res.json();
if (!res.ok) {
  console.error(`Form fetch FAILED (${res.status})`, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log(`Form: ${json.name}`);
console.log(`id:   ${json.id}\n`);
console.log('Fields (internal name — type — required):');
for (const g of json.fieldGroups ?? []) {
  for (const f of g.fields ?? []) {
    console.log(`  • ${f.name}  —  ${f.fieldType}${f.required ? '  —  REQUIRED' : ''}`);
    if (Array.isArray(f.options) && f.options.length) {
      console.log(`      options: ${f.options.map((o) => o.value).join(', ')}`);
    }
    for (const dep of f.dependentFields ?? []) {
      const df = dep.dependentField;
      if (df) console.log(`      ↳ dependent: ${df.name} (${df.fieldType}) when ${JSON.stringify(dep.dependentCondition?.values)}`);
    }
  }
}
