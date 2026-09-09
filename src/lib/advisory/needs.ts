// Advisory triage taxonomy — shared by the booking form (client), the
// booking API (zod), Strategists.specialties (Payload) and the ops console.
//
// A "need" is the one thing a member wants help with on a call. It drives
// strategist routing (Strategists.specialties) and is written to HubSpot as
// gh_help_areas so the CRM shows why someone booked before the call starts.
//
// Keep this file free of server-only imports — BookingForm.tsx is a client
// component and imports the labels directly.

export const NEEDS = [
  'starting_business',
  'behind_on_digital',
  'marketing_growth',
  'website',
  'funding_grants',
  'other',
] as const;

export type Need = (typeof NEEDS)[number];

export const NEED_LABELS: Record<Need, string> = {
  starting_business: 'Starting a business',
  behind_on_digital: "I'm behind on digital (Google, reviews, socials)",
  marketing_growth: 'Marketing & getting more customers',
  website: 'Website',
  funding_grants: 'Funding & grants',
  other: 'Something else',
};

export function needLabel(need: string | null | undefined): string {
  return need && need in NEED_LABELS ? NEED_LABELS[need as Need] : need ?? '—';
}

export function isNeed(value: unknown): value is Need {
  return typeof value === 'string' && (NEEDS as readonly string[]).includes(value);
}

/**
 * Map a user_profiles.help_areas value onto a need so the booking form can
 * be prefilled and first-sign-in routing has something to go on.
 * help_areas values: 'website' | 'marketing' | 'branding' | 'pricing' |
 * 'systems' | 'funding' | 'confidence'. Unmapped areas return null.
 */
const HELP_AREA_TO_NEED: Record<string, Need> = {
  website: 'website',
  marketing: 'marketing_growth',
  branding: 'marketing_growth',
  funding: 'funding_grants',
  systems: 'behind_on_digital',
  confidence: 'starting_business',
};

export function needFromHelpAreas(helpAreas: readonly string[] | null | undefined): Need | null {
  for (const area of helpAreas ?? []) {
    const need = HELP_AREA_TO_NEED[area];
    if (need) return need;
  }
  return null;
}

// ── Preferred slots ─────────────────────────────────────────────────────────

export const SLOT_WINDOWS = ['morning', 'midday', 'afternoon'] as const;
export type SlotWindow = (typeof SLOT_WINDOWS)[number];

export const SLOT_WINDOW_LABELS: Record<SlotWindow, string> = {
  morning: 'Morning (9–11am)',
  midday: 'Midday (11am–2pm)',
  afternoon: 'Afternoon (2–5pm)',
};

export interface PreferredSlot {
  /** YYYY-MM-DD in the member's local calendar (Canberra for almost everyone). */
  day: string;
  window: SlotWindow;
}

export const MAX_PREFERRED_SLOTS = 3;

/** "Tue 15 Sep · Morning (9–11am)" — for emails, ops tables and HubSpot notes. */
export function formatSlot(slot: PreferredSlot): string {
  const [y, m, d] = slot.day.split('-').map(Number);
  const date = y && m && d ? new Date(Date.UTC(y, m - 1, d)) : null;
  const day = date
    ? new Intl.DateTimeFormat('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }).format(date)
    : slot.day;
  return `${day} · ${SLOT_WINDOW_LABELS[slot.window] ?? slot.window}`;
}

export function formatSlots(slots: PreferredSlot[] | null | undefined): string {
  if (!slots?.length) return '';
  return slots.map(formatSlot).join('; ');
}

/** Coerce an unknown jsonb value into a typed slot list (drops bad entries). */
export function parseSlots(value: unknown): PreferredSlot[] {
  if (!Array.isArray(value)) return [];
  const out: PreferredSlot[] = [];
  for (const v of value) {
    if (
      v &&
      typeof v === 'object' &&
      typeof (v as PreferredSlot).day === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test((v as PreferredSlot).day) &&
      (SLOT_WINDOWS as readonly string[]).includes((v as PreferredSlot).window)
    ) {
      out.push({ day: (v as PreferredSlot).day, window: (v as PreferredSlot).window });
    }
    if (out.length >= MAX_PREFERRED_SLOTS) break;
  }
  return out;
}
