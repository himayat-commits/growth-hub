// Server-side helpers for service bookings (consultancy engagements
// requested via /services/[slug]).

import 'server-only';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { serviceBookings, type ServiceBooking } from '@/lib/db/schema';

export type BookingStatus =
  | 'requested'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const ACTIVE_STATUSES: BookingStatus[] = ['requested', 'scheduled', 'in_progress'];

export interface BookingInsert {
  userId: string;
  serviceSlug: string;
  serviceTitle: string;
  notes?: string | null;
  datePreference?: string | null;
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
    })
    .returning();
  if (!result[0]) throw new Error('createBooking: insert returned no row');
  return result[0];
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
