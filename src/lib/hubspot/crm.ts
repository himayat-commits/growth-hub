// HubSpot CRM sync for members (F4.4) — contacts + timeline notes.
//
// Everything here is FIRE-AND-FORGET: callers invoke `void syncX(...)` and
// never await the network. Inside a request the work is scheduled with
// Next's `after()` so it runs once the response has been sent but the
// serverless function is kept alive until it finishes (a bare dangling
// promise can be frozen with the lambda on Vercel). Each call has a 10 s
// timeout, reports failures to Sentry, and becomes a no-op (one console.warn
// per process) when HUBSPOT_PRIVATE_APP_TOKEN is unset — so a portal without
// HubSpot wired up behaves exactly as before.
//
// Request shapes verified against HubSpot's public OpenAPI specs
// (github.com/HubSpot/HubSpot-public-api-spec-collection, PublicApiSpecs/CRM):
//
//   Contacts/Rollouts/424/v3/contacts.json
//     POST /crm/v3/objects/contacts/batch/upsert     scope crm.objects.contacts.write
//       { inputs: [{ id: string (required), idProperty?: string,
//                    properties: Record<string,string> (required) }] }
//       200 { status, results: [{ id, new: boolean, properties, … }] }
//       207 same + errors[] / numErrors (partial failure)
//     POST /crm/v3/objects/contacts/search           scope crm.objects.contacts.read
//       { filterGroups: [{ filters: [{ propertyName, operator: 'EQ', value }] }],
//         properties: string[], limit }
//   Notes/Rollouts/424/v3/notes.json
//     POST /crm/v3/objects/notes                     scope crm.objects.contacts.write
//       { properties: { hs_timestamp, hs_note_body },
//         associations: [{ to: { id }, types: [{ associationCategory:
//           'HUBSPOT_DEFINED', associationTypeId: 202 }] }] }   // 202 = note→contact
//       201 { id, properties, createdAt, … }
//   Properties/Rollouts/145899/v3/properties.json
//     GET  /crm/v3/properties/contacts/{name}         200 | 404
//     POST /crm/v3/properties/contacts               scope crm.schemas.contacts.write
//       { name, label, type: 'string'|'enumeration'|…, fieldType: 'text'|'textarea'|
//         'select'|'checkbox'|…, groupName, options?: [{ label, value, hidden }] }
//
// The custom gh_* properties must exist on the portal before upsert will
// accept them (HubSpot rejects unknown property names with a 400) — run
// `ensureProperties()` once, or create them in Settings → Properties. See
// docs/HUBSPOT_CRM.md.

import 'server-only';
import { after } from 'next/server';
import * as Sentry from '@sentry/nextjs';

const HUBSPOT_HOST = 'https://api.hubapi.com';
const TIMEOUT_MS = 10_000;
/** HubSpot-defined association type: Note → Contact. */
export const ASSOC_NOTE_TO_CONTACT = 202;

let warnedNoToken = false;

function token(): string | null {
  const t = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  if (t) return t;
  if (!warnedNoToken) {
    warnedNoToken = true;
    console.warn('[hubspot.crm] HUBSPOT_PRIVATE_APP_TOKEN unset — CRM sync disabled (see docs/HUBSPOT_CRM.md)');
  }
  return null;
}

export class HubSpotError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = 'HubSpotError';
  }
}

async function hs<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const t = token();
  if (!t) throw new HubSpotError('HUBSPOT_PRIVATE_APP_TOKEN unset', 0, '');
  const res = await fetch(`${HUBSPOT_HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new HubSpotError(`HubSpot ${method} ${path} → ${res.status}`, res.status, text.slice(0, 2000));
  }
  return { status: res.status, data: (text ? JSON.parse(text) : {}) as T };
}

// ── Contacts ─────────────────────────────────────────────────────────────────

/** The member fields we mirror onto the HubSpot contact. All optional except
 *  email; undefined/null values are skipped (HubSpot treats "" as a clear). */
export interface ContactInput {
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  company?: string | null;
  /** free | foundations | growth | accelerate */
  gh_plan_tier?: string | null;
  gh_stage?: string | null;
  gh_industry?: string | null;
  /** Semicolon-joined for a multi-checkbox enumeration property. */
  gh_help_areas?: string[] | string | null;
  /** Assigned strategist slug. */
  gh_strategist?: string | null;
  /** WorkOS user id — lets ops jump from HubSpot back to /ops/members/<id>. */
  gh_workos_id?: string | null;
}

interface BatchUpsertResponse {
  status: string;
  results: Array<{ id: string; new: boolean; properties: Record<string, string> }>;
  errors?: Array<{ status: string; message: string }>;
  numErrors?: number;
}

function toProperties(input: ContactInput): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null || v === '') continue;
    props[k] = Array.isArray(v) ? v.join(';') : String(v);
  }
  return props;
}

/**
 * Create-or-update the contact keyed by email. Returns the HubSpot contact
 * id (needed to associate notes). Throws HubSpotError on non-2xx.
 */
export async function upsertContact(input: ContactInput): Promise<{ id: string; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const { data } = await hs<BatchUpsertResponse>('POST', '/crm/v3/objects/contacts/batch/upsert', {
    inputs: [{ id: email, idProperty: 'email', properties: toProperties({ ...input, email }) }],
  });
  const result = data.results?.[0];
  if (!result) {
    throw new HubSpotError(
      `HubSpot upsert returned no result (${data.numErrors ?? 0} errors: ${data.errors?.[0]?.message ?? 'n/a'})`,
      207,
      JSON.stringify(data).slice(0, 2000),
    );
  }
  return { id: result.id, created: result.new };
}

interface SearchResponse {
  total: number;
  results: Array<{ id: string; properties: Record<string, string> }>;
}

/** Look up a contact id by email without writing anything. */
export async function findContactIdByEmail(email: string): Promise<string | null> {
  const { data } = await hs<SearchResponse>('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email.trim().toLowerCase() }] }],
    properties: ['email'],
    limit: 1,
  });
  return data.results?.[0]?.id ?? null;
}

// ── Notes ────────────────────────────────────────────────────────────────────

/** Attach a timeline note to a contact. `body` is plain text; newlines are
 *  preserved (HubSpot renders hs_note_body as HTML, so we escape + <br>). */
export async function createNote(contactId: string, body: string, at: Date = new Date()): Promise<string> {
  const html = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  const { data } = await hs<{ id: string }>('POST', '/crm/v3/objects/notes', {
    properties: { hs_timestamp: at.toISOString(), hs_note_body: html.slice(0, 65_000) },
    associations: [
      {
        to: { id: contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASSOC_NOTE_TO_CONTACT }],
      },
    ],
  });
  return data.id;
}

// ── Fire-and-forget wrappers ─────────────────────────────────────────────────

function report(phase: string, err: unknown, extra: Record<string, unknown>) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[hubspot.crm] ${phase} failed: ${msg}`);
  Sentry.captureException(err, {
    tags: { area: 'hubspot.crm', phase },
    extra: {
      ...extra,
      ...(err instanceof HubSpotError ? { status: err.status, body: err.body } : {}),
    },
  });
}

/** Run `task` after the response is sent (request scope) or immediately
 *  detached (scripts / tests, where `after()` throws). Never throws. */
function schedule(task: () => Promise<void>): void {
  try {
    after(task);
  } catch {
    void task();
  }
}

/**
 * Upsert the contact and (optionally) attach a note, without ever throwing
 * or blocking. Call as `void syncContact(...)`. Returns nothing useful on
 * purpose — nobody should wait on it.
 */
export async function syncContact(input: ContactInput, note?: string): Promise<void> {
  if (!token()) return;
  schedule(async () => {
    try {
      const { id } = await upsertContact(input);
      if (note) await createNote(id, note);
    } catch (err) {
      report(note ? 'upsert+note' : 'upsert', err, { email: input.email });
    }
  });
}

/** Attach a note to an existing contact by email, without throwing. */
export async function syncNote(email: string, note: string): Promise<void> {
  if (!token()) return;
  schedule(async () => {
    try {
      const id = (await findContactIdByEmail(email)) ?? (await upsertContact({ email })).id;
      await createNote(id, note);
    } catch (err) {
      report('note', err, { email });
    }
  });
}

// ── One-off property provisioning (run by the owner, never at runtime) ───────

export interface PropertyDef {
  name: string;
  label: string;
  type: 'string' | 'enumeration';
  fieldType: 'text' | 'textarea' | 'select' | 'checkbox';
  description?: string;
  options?: Array<{ label: string; value: string }>;
}

/** The custom contact properties this integration writes. Keep in sync with
 *  docs/HUBSPOT_CRM.md. */
export const GH_CONTACT_PROPERTIES: PropertyDef[] = [
  {
    name: 'gh_plan_tier',
    label: 'GH plan tier',
    type: 'enumeration',
    fieldType: 'select',
    description: 'Growth Hub plan (free until a paid subscription is active).',
    options: ['free', 'foundations', 'growth', 'accelerate'].map((v) => ({ label: v, value: v })),
  },
  {
    name: 'gh_stage',
    label: 'GH business stage',
    type: 'enumeration',
    fieldType: 'select',
    options: ['idea', 'just-starting', 'running', 'established'].map((v) => ({ label: v, value: v })),
  },
  {
    name: 'gh_industry',
    label: 'GH industry',
    type: 'enumeration',
    fieldType: 'select',
    options: ['retail', 'services', 'food', 'creative', 'trades', 'other'].map((v) => ({ label: v, value: v })),
  },
  {
    name: 'gh_help_areas',
    label: 'GH help areas',
    type: 'enumeration',
    fieldType: 'checkbox',
    description: 'Profile help areas plus the need chosen on the latest booking (semicolon-joined).',
    options: [
      'website', 'marketing', 'branding', 'pricing', 'systems', 'funding', 'confidence',
      'starting_business', 'behind_on_digital', 'marketing_growth', 'funding_grants', 'other',
    ].map((v) => ({ label: v, value: v })),
  },
  {
    name: 'gh_strategist',
    label: 'GH strategist',
    type: 'string',
    fieldType: 'text',
    description: 'Slug of the assigned Growth Hub strategist.',
  },
  {
    name: 'gh_workos_id',
    label: 'GH member id',
    type: 'string',
    fieldType: 'text',
    description: 'WorkOS user id — open https://app.thegrowthhub.com.au/ops/members/<id>.',
  },
];

/**
 * Create any missing gh_* contact properties. Idempotent (GET before POST).
 * Needs `crm.schemas.contacts.write` in addition to the runtime scopes.
 * Exported for a one-off script / REPL — NOT called by the app.
 */
export async function ensureProperties(
  groupName = 'contactinformation',
): Promise<{ created: string[]; existing: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];
  for (const def of GH_CONTACT_PROPERTIES) {
    try {
      await hs('GET', `/crm/v3/properties/contacts/${def.name}`);
      existing.push(def.name);
      continue;
    } catch (err) {
      if (!(err instanceof HubSpotError) || err.status !== 404) throw err;
    }
    await hs('POST', '/crm/v3/properties/contacts', {
      ...def,
      groupName,
      options: def.options?.map((o, i) => ({ ...o, hidden: false, displayOrder: i })),
    });
    created.push(def.name);
  }
  return { created, existing };
}
