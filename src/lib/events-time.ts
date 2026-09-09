// Timezone-correct event times (GTM review F3.1).
//
// Payload stores `date` as an instant and `time` as free text ("12:30 – 1:30
// pm"). Both the .ics route and the JSON-LD used to combine them with
// `setHours`, i.e. in the *server's* local zone — Vercel runs UTC, so
// "12:30 pm" became 22:30 AEST in the attendee's calendar. This module
// interprets the wall-clock text in Australia/Canberra on the event's
// Canberra calendar date and returns true UTC instants.
//
// DST handling: the zone offset (+10:00 AEST / +11:00 AEDT) is derived for
// the specific date via Intl.DateTimeFormat with timeZone Australia/Canberra
// — no timezone library, no hard-coded transition table. Two passes resolve
// wall-clock → UTC across a DST boundary (the offset at the first guess is
// re-checked at the result).
//
// Pure functions, no I/O. Worked examples (verified with node, see the
// commit message; there is no unit-test runner in this repo):
//
//   parseCanberraRange('2026-07-09T02:30:00.000Z', '12:30 – 1:30 pm')
//     → start 2026-07-09T02:30:00.000Z, end 2026-07-09T03:30:00.000Z   (AEST, +10)
//   parseCanberraRange('2026-11-05T00:00:00.000Z', '6 – 8 pm')
//     → start 2026-11-05T07:00:00.000Z, end 2026-11-05T09:00:00.000Z   (AEDT, +11)
//   parseCanberraRange('2026-07-08T14:00:00.000Z', '10:00 am – 11:30 am')
//     → date is 9 Jul in Canberra (14:00Z = local midnight), start 2026-07-09T00:00:00.000Z
//   parseCanberraRange('2026-10-04T00:00:00.000Z', '1 – 3 am')          (DST starts 02:00 that day)
//     → start 2026-10-03T15:00:00.000Z, end 2026-10-03T16:00:00.000Z   (one real hour)
//   parseCanberraRange('2026-04-05T00:00:00.000Z', '11:30 – 12:30 pm')
//     → start 11:30 AM (a bare start meridiem flips to am when pm would put it after the end)
//   parseCanberraRange('2026-07-09T02:30:00.000Z', 'Doors 6pm')
//     → { allDay: true, dateKey: '2026-07-09' }  (unrecognised text degrades to all-day)

export const CANBERRA_TZ = 'Australia/Canberra';

export interface CanberraRange {
  /** UTC instant of the start (or Canberra midnight for all-day). */
  start: Date;
  /** UTC instant of the end; absent for all-day events. */
  end?: Date;
  allDay: boolean;
  /** Canberra calendar date as YYYY-MM-DD — what "the event's date" means. */
  dateKey: string;
}

interface WallClock {
  y: number;
  m: number; // 1-12
  d: number;
  h: number;
  mi: number;
  s: number;
}

const partsFmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: CANBERRA_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Wall-clock components of an instant as seen in Canberra. */
export function canberraParts(at: Date): WallClock {
  const p: Record<string, string> = {};
  for (const part of partsFmt.formatToParts(at)) p[part.type] = part.value;
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    // Some engines emit "24" for midnight even with h23; normalise.
    h: Number(p.hour) % 24,
    mi: Number(p.minute),
    s: Number(p.second),
  };
}

/** Offset of Australia/Canberra from UTC at `at`, in minutes (600 or 660). */
export function canberraOffsetMinutes(at: Date): number {
  const p = canberraParts(at);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** Convert a Canberra wall-clock time to the UTC instant it names. */
export function canberraWallClockToUtc(y: number, m: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi, 0, 0);
  const off1 = canberraOffsetMinutes(new Date(guess));
  let result = guess - off1 * 60_000;
  // Re-check at the result: if the first guess straddled a DST transition the
  // offset differs and the second pass corrects it.
  const off2 = canberraOffsetMinutes(new Date(result));
  if (off2 !== off1) result = guess - off2 * 60_000;
  return new Date(result);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD of an instant in Canberra. */
export function canberraDateKey(at: Date): string {
  const p = canberraParts(at);
  return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
}

/** Canberra calendar date `days` days after `at` (handles DST; uses noon to
 *  avoid midnight edge cases). */
export function canberraDateKeyPlusDays(at: Date, days: number): string {
  const p = canberraParts(at);
  const noon = canberraWallClockToUtc(p.y, p.m, p.d, 12, 0);
  return canberraDateKey(new Date(noon.getTime() + days * 86_400_000));
}

/** Canberra midnight (as a UTC instant) at the start of the given YYYY-MM-DD. */
export function canberraStartOfDay(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return canberraWallClockToUtc(y, m, d, 0, 0);
}

const TIME_RANGE_RE =
  /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–\-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/;

function to24(h: number, ampm: string): number {
  if (ampm === 'pm' && h < 12) return h + 12;
  if (ampm === 'am' && h === 12) return 0;
  return h;
}

/**
 * Interpret the free-text `time` field as Canberra wall-clock on the event's
 * Canberra calendar date. Accepts "12:30 – 1:30 pm", "6 – 8 pm",
 * "10:00 am – 11:30 am" (en dash or hyphen; a missing meridiem on the start
 * inherits the end's). Unrecognised text → all-day. Returns null only when
 * `dateIso` isn't a valid date.
 */
export function parseCanberraRange(
  dateIso: string,
  timeStr: string | null | undefined,
): CanberraRange | null {
  const day = new Date(dateIso);
  if (!dateIso || Number.isNaN(day.getTime())) return null;

  const { y, m, d } = canberraParts(day);
  const dateKey = `${y}-${pad2(m)}-${pad2(d)}`;
  const allDay = (): CanberraRange => ({
    start: canberraWallClockToUtc(y, m, d, 0, 0),
    allDay: true,
    dateKey,
  });

  if (!timeStr) return allDay();
  const match = timeStr.toLowerCase().replace(/\s+/g, ' ').trim().match(TIME_RANGE_RE);
  if (!match) return allDay();

  const [, sH, sM, sMer, eH, eM, eMer] = match;
  const endMer = (eMer ?? sMer ?? 'pm').toLowerCase();
  const startMer = (sMer ?? endMer).toLowerCase();

  const startMi = Number(sM ?? '0');
  const endMi = Number(eM ?? '0');
  let startH = to24(Number(sH), startMer);
  let endH = to24(Number(eH), endMer);
  // "11 – 1 pm" / "11:30 – 12:30 pm": the start had no meridiem and inheriting
  // the end's puts it after the end → the writer meant the other half of the
  // day (11 am). Only flip when it actually fixes the ordering.
  if (!sMer && startH * 60 + startMi > endH * 60 + endMi) {
    const alt = to24(Number(sH), startMer === 'pm' ? 'am' : 'pm');
    if (alt * 60 + startMi < endH * 60 + endMi) startH = alt;
  }
  // Still inverted ("11 pm – 1 am"): the range crosses midnight → end is the
  // next day (Date.UTC normalises hour 25 correctly).
  if (endH * 60 + endMi <= startH * 60 + startMi) endH += 24;

  return {
    start: canberraWallClockToUtc(y, m, d, startH, startMi),
    end: canberraWallClockToUtc(y, m, d, endH, endMi),
    allDay: false,
    dateKey,
  };
}

// ── Display helpers (Canberra) ─────────────────────────────────────────────

/** "Thursday 9 July 2026" in Canberra. */
export function formatCanberraDateLong(at: Date | string): string {
  const d = typeof at === 'string' ? new Date(at) : at;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: CANBERRA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** "AEST" or "AEDT" for the given instant. */
export function canberraZoneAbbrev(at: Date): string {
  const part = new Intl.DateTimeFormat('en-AU', { timeZone: CANBERRA_TZ, timeZoneName: 'short' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? 'AEST';
}

/** The `time` text plus the zone, e.g. "12:30 – 1:30 pm AEST"; "" if no time. */
export function formatCanberraTimeLabel(dateIso: string, timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const range = parseCanberraRange(dateIso, timeStr);
  const at = range?.start ?? new Date(dateIso);
  return `${timeStr.trim()} ${canberraZoneAbbrev(at)}`;
}
