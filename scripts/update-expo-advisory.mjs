// One-off: swap the /expo/apply "Speak on stage" role for "Help desk or
// advisory support" in the live HubSpot form (portal 442026767, ap1).
//
//   - Adds the "Help desk or advisory support" option to the expo_involvement
//     contact PROPERTY. Keeps "Speak on stage" on the property so any existing
//     applicant data is preserved (we only remove it from the form UI).
//   - Updates the live FORM: involvement options become stall / workshop /
//     advisory; the advisory dependent question reuses the existing
//     expo_speaker_details field, relabelled.
//   - Relabels the expo_speaker_details property to reflect the reuse.
//
// Idempotent: safe to re-run. Token needs scopes forms +
// crm.schemas.contacts.write. Reads HUBSPOT_PRIVATE_APP_TOKEN (and the form id)
// from the environment or .env.local.
//
//   node scripts/update-expo-advisory.mjs            # apply
//   node scripts/update-expo-advisory.mjs --dry-run  # show changes only

import { readFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');

function fromEnvFile(key) {
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || fromEnvFile('HUBSPOT_PRIVATE_APP_TOKEN');
const FORM_ID =
  process.env.NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID || fromEnvFile('NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID');

if (!TOKEN) {
  console.error('Set HUBSPOT_PRIVATE_APP_TOKEN (env or .env.local).');
  process.exit(1);
}
if (!FORM_ID) {
  console.error('Set NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID (env or .env.local).');
  process.exit(1);
}

const API = 'https://api.hubapi.com';
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

const ADVISORY = { label: 'Help desk or advisory support', value: 'help_desk_advisory' };
const SPEAK_VALUE = 'speak_on_stage';

const ADVISORY_DETAIL_FIELD = {
  objectTypeId: '0-1',
  name: 'expo_speaker_details', // reused property
  label: 'Your help desk: what can you help people with?',
  required: true,
  hidden: false,
  placeholder:
    'The kind of one-to-one help you can give — getting online, business planning, marketing, finance, or general advice.',
  fieldType: 'multi_line_text',
};

// ---------------------------------------------------------------------------
// 1. Contact property: add the advisory option (keep existing options).
// ---------------------------------------------------------------------------
{
  const { status, json } = await call('GET', '/crm/v3/properties/contacts/expo_involvement');
  if (status !== 200) {
    console.error('Could not read expo_involvement property', status, JSON.stringify(json));
    process.exit(1);
  }
  const options = json.options || [];
  console.log('property options now:', options.map((o) => o.label).join(' · '));
  if (options.some((o) => o.value === ADVISORY.value)) {
    console.log('property already has advisory option — skipping.');
  } else {
    const next = [...options, { ...ADVISORY, description: '', displayOrder: options.length }];
    if (DRY) {
      console.log('[dry-run] would set property options ->', next.map((o) => o.label).join(' · '));
    } else {
      const r = await call('PATCH', '/crm/v3/properties/contacts/expo_involvement', { options: next });
      console.log(r.status === 200 ? 'property options updated.' : `property update FAILED ${r.status} ${JSON.stringify(r.json)}`);
      if (r.status !== 200) process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// 1b. Relabel the reused expo_speaker_details property.
// ---------------------------------------------------------------------------
if (!DRY) {
  const r = await call('PATCH', '/crm/v3/properties/contacts/expo_speaker_details', {
    label: 'Expo - speaker / advisory details',
    description:
      'Proposed talk topic + speaking background, or (for help desk / advisory applicants) what they can help with. Set by the /expo/apply form.',
  });
  console.log(r.status === 200 ? 'expo_speaker_details relabelled.' : `relabel FAILED ${r.status} ${JSON.stringify(r.json)}`);
} else {
  console.log('[dry-run] would relabel expo_speaker_details property.');
}

// ---------------------------------------------------------------------------
// 2. Form: swap involvement option + dependent question (speak -> advisory).
// ---------------------------------------------------------------------------
{
  const { status, json: form } = await call('GET', `/marketing/v3/forms/${FORM_ID}`);
  if (status !== 200) {
    console.error('Could not read form', status, JSON.stringify(form).slice(0, 300));
    process.exit(1);
  }

  const fieldGroups = form.fieldGroups || [];
  const group = fieldGroups.find((g) => (g.fields || []).some((f) => f.name === 'expo_involvement'));
  const field = group?.fields.find((f) => f.name === 'expo_involvement');
  if (!field) {
    console.error('expo_involvement field not found in form.');
    process.exit(1);
  }

  // Options shown in the form UI: drop speak, ensure advisory present.
  field.options = (field.options || []).filter((o) => o.value !== SPEAK_VALUE);
  if (!field.options.some((o) => o.value === ADVISORY.value)) {
    field.options.push({ ...ADVISORY, description: '', displayOrder: field.options.length });
  }

  // Dependent questions: drop the speak one, add the advisory one.
  if (Array.isArray(field.dependentFields)) {
    field.dependentFields = field.dependentFields.filter(
      (d) => !(d.dependentCondition?.values || []).includes(SPEAK_VALUE),
    );
    if (!field.dependentFields.some((d) => (d.dependentCondition?.values || []).includes(ADVISORY.value))) {
      field.dependentFields.push({
        dependentCondition: { operator: 'set_any', values: [ADVISORY.value] },
        dependentField: ADVISORY_DETAIL_FIELD,
      });
    }
  }

  console.log('form options ->', field.options.map((o) => o.label).join(' · '));
  if (DRY) {
    console.log('[dry-run] would PATCH form', FORM_ID);
  } else {
    const r = await call('PATCH', `/marketing/v3/forms/${FORM_ID}`, { fieldGroups });
    console.log(r.status === 200 ? 'form updated.' : `form update FAILED ${r.status} ${JSON.stringify(r.json).slice(0, 400)}`);
    if (r.status !== 200) process.exit(1);
  }
}

console.log(DRY ? '\nDry run complete.' : '\nDone.');
