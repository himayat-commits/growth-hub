// Server-side helpers for service bookings (consultancy engagements
// requested via /services/[slug]).

import 'server-only';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { serviceBookings, type ServiceBooking } from '@/lib/db/schema';
import type { PreferredSlot } from '@/lib/advisory/needs';

export type BookingStatus =
  | 'requested'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const ACTIVE_STATUSES: BookingStatus[] = ['requested', 'scheduled', 'in_progress'];

/** The free 30-minute Growth Call. One per member for life (Free-tier benefit). */
export const GROWTH_CALL_SLUG = 'growth-call';

/**
 * Server-side status transition map — the only legal moves. Enforced in
 * PATCH /api/ops/bookings/[id] (so curl can't do completed→requested) and
 * mirrored by BookingActions.tsx for the buttons it renders.
 *
 *   requested  → scheduled | cancelled
 *   scheduled  → completed | cancelled
 *   completed  → (terminal)
 *   cancelled  → requested        (re-open a request cancelled by mistake)
 *
 * `in_progress` is a legacy state no longer offered as a target; rows
 * already in it can still be closed out.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  requested: ['scheduled', 'cancelled'],
  scheduled: ['completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['requested'],
};

export function canTransition(from: string, to: string): to is BookingStatus {
  const allowed = BOOKING_TRANSITIONS[from as BookingStatus];
  return Boolean(allowed?.includes(to as BookingStatus));
}

export interface BookingInsert {
  userId: string;
  serviceSlug: string;
  serviceTitle: string;
  notes?: string | null;
  datePreference?: string | null;
  need?: string | null;
  preferredSlots?: PreferredSlot[] | null;
  strategistSlug?: string | null;
}

/** Create a booking row in 'requested' state. Returns the created row. */
export async function createBooking(input: BookingInsert): Promise<ServiceBooking> {
  const result = await getDb()
    .insert(serviceBookings)
    .values({
      userId: input.userId,
      serviceSlug: input.serviceSlug,
      serviceTitle: input.serviceTitle,
      notes: input.notes ?? null,
      datePreference: input.datePreference ?? null,
      need: input.need ?? null,
      preferredSlots: input.preferredSlots?.length ? input.preferredSlots : null,
      strategistSlug: input.strategistSlug ?? null,
    })
    .returning();
  if (!result[0]) throw new Error('createBooking: insert returned no row');
  return result[0];
}

export async function getBookingById(id: number): Promise<ServiceBooking | null> {
  const rows = await getDb()
    .select()
    .from(serviceBookings)
    .where(eq(serviceBookings.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** All bookings for a user, newest first. */
export async function getUserBookings(userId: string): Promise<ServiceBooking[]> {
  return getDb()
    .select()
    .from(serviceBookings)
    .where(eq(serviceBookings.userId, userId))
    .orderBy(desc(serviceBookings.requestedAt));
}

/** Just the open / in-flight bookings — for the dashboard "Active services"
 *  card and the top section of /services. */
export async function getActiveBookings(userId: string): Promise<ServiceBooking[]> {
  return getDb()
    .select()
    .from(serviceBookings)
    .where(
      and(
        eq(serviceBookings.userId, userId),
        inArray(serviceBookings.status, ACTIVE_STATUSES),
      ),
    )
    .orderBy(desc(serviceBookings.requestedAt));
}

/** Has this user already requested a specific service? Used to surface
 *  "Already requested" state on the service detail page so we don't get
 *  silent duplicates. */
export async function hasOpenBookingFor(
  userId: string,
  serviceSlug: string,
): Promise<boolean> {
  const rows = await getDb()
    .select({ id: serviceBookings.id })
    .from(serviceBookings)
    .where(
      and(
        eq(serviceBookings.userId, userId),
        eq(serviceBookings.serviceSlug, serviceSlug),
        inArray(serviceBookings.status, ACTIVE_STATUSES),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/**
 * Lifetime rule for the free Growth Call: ANY non-cancelled growth-call row
 * (requested, scheduled, in_progress or completed) means the member has used
 * their one free call. Cancelled rows don't count so a member whose request
 * was cancelled by ops can book again.
 */
export async function hasEverBookedGrowthCall(userId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: serviceBookings.id })
    .from(serviceBookings)
    .where(
      and(
        eq(serviceBookings.userId, userId),
        eq(serviceBookings.serviceSlug, GROWTH_CALL_SLUG),
        ne(serviceBookings.status, 'cancelled'),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Whether the member can request this service right now — combines the
 *  lifetime Growth Call rule with the open-booking duplicate guard. */
export async function isBookingBlocked(userId: string, serviceSlug: string): Promise<boolean> {
  return serviceSlug === GROWTH_CALL_SLUG
    ? hasEverBookedGrowthCall(userId)
    : hasOpenBookingFor(userId, serviceSlug);
}

/** Human-readable label for a status. */
export function statusLabel(status: string): string {
  switch (status) {
    case 'requested': return 'Requested';
    case 'scheduled': return 'Scheduled';
    case 'in_progress': return 'In progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}
