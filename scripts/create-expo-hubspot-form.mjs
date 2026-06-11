// One-off: creates the /expo/apply application form in HubSpot (portal 442026767)
// plus the custom contact properties it writes to.
//
// Needs a Private App / Service Key token with scopes: forms,
// crm.schemas.contacts.write. The CLI personal access key in
// ~/hubspot.config.yml does NOT have these scopes.
//
// Run:  HUBSPOT_PRIVATE_APP_TOKEN=pat-... node scripts/create-expo-hubspot-form.mjs
//
// Prints the form GUID to set as NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID in
// .env.local and the Vercel project env (redeploy required - NEXT_PUBLIC_*
// is inlined at build time). Note: this portal is in the ap1 region, so
// NEXT_PUBLIC_HUBSPOT_REGION=ap1.

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
if (!TOKEN) {
  console.error('Set HUBSPOT_PRIVATE_APP_TOKEN first.');
  process.exit(1);
}

const API = 'https://api.hubapi.com';
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

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

// ---------------------------------------------------------------------------
// 1. Custom contact properties
// ---------------------------------------------------------------------------

const ROLES = [
  { label: 'Host a stall', value: 'host_a_stall' },
  { label: 'Run a workshop', value: 'run_a_workshop' },
  { label: 'Speak on stage', value: 'speak_on_stage' },
];

const PROPERTIES = [
  {
    name: 'expo_involvement',
    label: 'Expo involvement (Entrepreneurship for Everyone)',
    type: 'enumeration',
    fieldType: 'checkbox',
    groupName: 'contactinformation',
    description:
      'How they want to take part in the Entrepreneurship for Everyone summit (9 Jul 2026). Set by the /expo/apply form.',
    options: ROLES.map((r, i) => ({ label: r.label, value: r.value, displayOrder: i })),
  },
  {
    name: 'expo_stall_details',
    label: 'Expo - stall details',
    type: 'string',
    fieldType: 'textarea',
    groupName: 'contactinformation',
    description: 'What they would showcase at their stall. Set by the /expo/apply form.',
  },
  {
    name: 'expo_workshop_details',
    label: 'Expo - workshop details',
    type: 'string',
    fieldType: 'textarea',
    groupName: 'contactinformation',
    description: 'Proposed workshop topic and format. Set by the /expo/apply form.',
  },
  {
    name: 'expo_speaker_details',
    label: 'Expo - speaker details',
    type: 'string',
    fieldType: 'textarea',
    groupName: 'contactinformation',
    description: 'Proposed talk topic and speaking background. Set by the /expo/apply form.',
  },
];

for (const prop of PROPERTIES) {
  const { status, json } = await call('POST', '/crm/v3/properties/contacts', prop);
  if (status === 201) {
    console.log(`property created: ${prop.name}`);
  } else if (status === 409) {
    console.log(`property exists:  ${prop.name}`);
  } else {
    console.error(`property FAILED:  ${prop.name} (${status})`, JSON.stringify(json));
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 2. The form
// ---------------------------------------------------------------------------

const field = (overrides) => ({
  objectTypeId: '0-1',
  hidden: false,
  required: false,
  ...overrides,
});

const group = (...fields) => ({
  groupType: 'default_group',
  richTextType: 'text',
  fields,
});

// Conditional follow-up shown only when its role is ticked.
const dependent = (roleValue, fieldDef) => ({
  dependentCondition: { operator: 'set_any', values: [roleValue] },
  dependentField: fieldDef,
});

const DETAIL_FIELDS = {
  host_a_stall: field({
    name: 'expo_stall_details',
    label: 'Your stall: what would you showcase?',
    fieldType: 'multi_line_text',
    required: true,
    placeholder: 'Your product or service, and what visitors will see at your table.',
  }),
  run_a_workshop: field({
    name: 'expo_workshop_details',
    label: 'Your workshop: topic and format',
    fieldType: 'multi_line_text',
    required: true,
    placeholder: 'What you would teach, how long it runs, and who it helps.',
  }),
  speak_on_stage: field({
    name: 'expo_speaker_details',
    label: 'Your talk: topic and speaking background',
    fieldType: 'multi_line_text',
    required: true,
    placeholder: 'What you would speak about, and any past talks or panels.',
  }),
};

const FORM = {
  formType: 'hubspot',
  name: 'Expo apply - Entrepreneurship for Everyone (stall / workshop / speaker)',
  archived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  fieldGroups: [
    group(
      field({ name: 'firstname', label: 'First name', fieldType: 'single_line_text', required: true }),
      field({ name: 'lastname', label: 'Last name', fieldType: 'single_line_text', required: true }),
    ),
    group(
      field({
        name: 'email',
        label: 'Email',
        fieldType: 'email',
        required: true,
        validation: { blockedEmailDomains: [], useDefaultBlockList: false },
      }),
    ),
    group(
      field({
        name: 'phone',
        label: 'Phone (optional)',
        fieldType: 'phone',
        useCountryCodeSelect: false,
        validation: { minAllowedDigits: 7, maxAllowedDigits: 20 },
      }),
    ),
    group(
      field({ name: 'company', label: 'Business or organisation', fieldType: 'single_line_text', required: true }),
    ),
    group(
      field({ name: 'website', label: 'Website or social link (optional)', fieldType: 'single_line_text' }),
    ),
    group(
      field({
        name: 'expo_involvement',
        label: 'How would you like to take part? Tick all that apply.',
        fieldType: 'multiple_checkboxes',
        required: true,
        options: ROLES.map((r, i) => ({ label: r.label, value: r.value, description: '', displayOrder: i })),
        dependentFields: Object.entries(DETAIL_FIELDS).map(([value, f]) => dependent(value, f)),
      }),
    ),
    group(
      field({
        name: 'message',
        label: 'Anything else we should know? (optional)',
        fieldType: 'multi_line_text',
      }),
    ),
  ],
  configuration: {
    language: 'en',
    cloneable: true,
    editable: true,
    archivable: true,
    recaptchaEnabled: false,
    notifyContactOwner: false,
    createNewContactForNewEmail: true,
    prePopulateKnownValues: true,
    allowLinkToResetKnownValues: false,
    postSubmitAction: {
      type: 'thank_you',
      value:
        "Thanks - your application is in. We read every one and we'll reply within a few business days from hello@himayat.com.au.",
    },
    lifecycleStages: [],
  },
  displayOptions: {
    renderRawHtml: false,
    theme: 'default_style',
    submitButtonText: 'Submit application',
  },
  legalConsentOptions: { type: 'none' },
};

let { status, json } = await call('POST', '/marketing/v3/forms', FORM);

// Some portal tiers reject dependent (conditional) fields - fall back to
// always-visible optional follow-ups so the form still ships.
if (status >= 400 && JSON.stringify(json).toLowerCase().includes('dependent')) {
  console.warn('Dependent fields rejected by this portal - retrying without conditional logic.');
  const involvement = FORM.fieldGroups.find((g) => g.fields[0].name === 'expo_involvement');
  delete involvement.fields[0].dependentFields;
  const tail = FORM.fieldGroups.pop(); // keep "anything else" last
  for (const f of Object.values(DETAIL_FIELDS)) {
    FORM.fieldGroups.push(group({ ...f, required: false, label: `${f.label} (if applicable)` }));
  }
  FORM.fieldGroups.push(tail);
  ({ status, json } = await call('POST', '/marketing/v3/forms', FORM));
}

if (status !== 200 && status !== 201) {
  console.error(`form creation FAILED (${status})`, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log('\nForm created.');
console.log(`  name:    ${json.name}`);
console.log(`  formId:  ${json.id}`);
console.log('\nSet these in .env.local AND the Vercel project env, then redeploy:');
console.log('  NEXT_PUBLIC_HUBSPOT_PORTAL_ID=442026767');
console.log(`  NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID=${json.id}`);
console.log('  NEXT_PUBLIC_HUBSPOT_REGION=ap1');
