// /ops/members/[userId] — the adviser 360 (F4.3). Everything an adviser
// needs before a call on one page: profile, plan, strategist, every booking
// (need, slots, prep notes, outcome), the message thread, the onboarding
// wizard summary and a HubSpot jump link.
//
// Ops-gated by the /ops layout AND here (defence in depth, same as siblings).
// Strategists only see members assigned to them (canAccessMemberThread).

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getOpsUser } from '@/lib/auth/ops';
import { canAccessMemberThread } from '@/lib/auth/ops-inbox';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { getUserBookings } from '@/lib/db/bookings';
import { getThread } from '@/lib/db/messages';
import { loadOnboardingRow } from '@/lib/wizard/provisioning-store';
import { getStrategistBySlug } from '@/lib/cms';
import { getMemberContact } from '@/lib/auth/member-contact';
import { needLabel, parseSlots, formatSlot } from '@/lib/advisory/needs';
import BookingActions from '../../bookings/BookingActions';

export const dynamic = 'force-dynamic';

const HUBSPOT_PORTAL_ID = '442026767';
/** No stable per-email deep link exists; the contacts list view accepts a
 *  free-text query so this lands on the (single) matching contact. */
function hubspotSearchUrl(email: string): string {
  return `https://app-ap1.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/objects/0-1/views/all/list?query=${encodeURIComponent(email)}`;
}

type Params = Promise<{ userId: string }>;

const fmt = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
const fmtDay = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' });

export default async function OpsMemberPage({ params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) redirect('/dashboard');

  const { userId } = await params;
  if (!(await canAccessMemberThread(opsUser, userId))) redirect('/ops/bookings');

  const db = getDb();
  const [profileRows, sub, bookings, thread, obRow, contact] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
    getSubscription(userId),
    getUserBookings(userId),
    getThread(userId),
    loadOnboardingRow(userId),
    getMemberContact(userId),
  ]);
  const profile = profileRows[0];
  if (!profile && !sub && bookings.length === 0) notFound();

  const strategist = profile?.assignedStrategistId
    ? await getStrategistBySlug(profile.assignedStrategistId).catch(() => null)
    : null;

  const tier = getEffectivePlan(sub);
  const email = contact?.email ?? sub?.email ?? null;
  const memberName = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || null;
  const wizard = obRow?.state;
  const title = profile?.businessName ?? email ?? userId;

  return (
    <>
      <div style={{ padding: '12px 0 0' }}>
        <Link href="/ops/bookings" className="gh-ops-meta" style={{ textDecoration: 'none' }}>
          ← Bookings
        </Link>
      </div>

      <div className="gh-ops-head-inner">
        <h1>{title}</h1>
        <p>
          Member 360 · <code style={{ fontSize: 12 }}>{userId}</code>
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <Link href={`/ops/inbox/${encodeURIComponent(userId)}`} className="gh-btn ghost" style={{ fontSize: 12 }}>
            Open thread / reply →
          </Link>
          {email && (
            <>
              <a href={hubspotSearchUrl(email)} target="_blank" rel="noopener noreferrer" className="gh-btn ghost" style={{ fontSize: 12 }}>
                HubSpot contact →
              </a>
              <a href={`mailto:${email}`} className="gh-btn ghost" style={{ fontSize: 12 }}>
                Email →
              </a>
            </>
          )}
        </div>
      </div>

      <div className="gh-ops-360">
        {/* ── Profile + plan ─────────────────────────────────────────────── */}
        <section className="gh-ops-section">
          <h2>Profile</h2>
          <dl className="gh-ops-kv">
            <dt>Name</dt>
            <dd>{memberName ?? '—'}</dd>
            <dt>Email</dt>
            <dd>{email ?? '—'}{contact ? <span className="gh-ops-meta"> · via {contact.source}</span> : null}</dd>
            <dt>Business</dt>
            <dd>{profile?.businessName ?? '—'}</dd>
            <dt>About</dt>
            <dd>{profile?.businessDescription ?? '—'}</dd>
            <dt>Stage</dt>
            <dd>{profile?.stage ?? '—'}</dd>
            <dt>Industry</dt>
            <dd>{profile?.industry ?? '—'}</dd>
            <dt>Help areas</dt>
            <dd>{profile?.helpAreas?.length ? profile.helpAreas.join(', ') : '—'}</dd>
            <dt>City</dt>
            <dd>{profile?.city ?? '—'}</dd>
            <dt>Language</dt>
            <dd>{profile?.preferredLanguage ?? 'en'}</dd>
            <dt>Phone</dt>
            <dd>{profile?.phone ?? '—'}</dd>
            <dt>Profile complete</dt>
            <dd>{profile?.profileCompletePct ?? 0}%</dd>
            <dt>Member since</dt>
            <dd>{profile ? fmtDay.format(profile.createdAt) : '—'}</dd>
          </dl>

          <h2 style={{ marginTop: 22 }}>Plan</h2>
          <dl className="gh-ops-kv">
            <dt>Tier</dt>
            <dd>
              <span className={`gh-ops-status status-${tier === 'free' ? 'requested' : 'completed'}`}>{tier}</span>
            </dd>
            <dt>Status</dt>
            <dd>{sub?.subscriptionStatus ?? '—'}</dd>
            <dt>Interval</dt>
            <dd>{sub?.billingInterval ?? '—'}</dd>
            <dt>Period ends</dt>
            <dd>{sub?.currentPeriodEnd ? fmtDay.format(sub.currentPeriodEnd) : '—'}{sub?.cancelAtPeriodEnd ? ' (cancelling)' : ''}</dd>
          </dl>

          <h2 style={{ marginTop: 22 }}>Strategist</h2>
          <dl className="gh-ops-kv">
            <dt>Assigned</dt>
            <dd>
              {strategist ? `${strategist.name} · ${strategist.role}` : profile?.assignedStrategistId ?? 'unassigned'}
            </dd>
            {strategist?.specialties?.length ? (
              <>
                <dt>Specialties</dt>
                <dd>{strategist.specialties.map((s) => needLabel(s)).join(', ')}</dd>
              </>
            ) : null}
            {strategist?.calendlyUrl && (
              <>
                <dt>Calendly</dt>
                <dd><a href={strategist.calendlyUrl} target="_blank" rel="noopener noreferrer">{strategist.calendlyUrl}</a></dd>
              </>
            )}
          </dl>
          <p className="gh-ops-meta" style={{ marginTop: 8 }}>
            Reassign from <Link href="/ops/signups">Signups</Link>.
          </p>

          <h2 style={{ marginTop: 22 }}>Onboarding wizard</h2>
          {wizard ? (
            <dl className="gh-ops-kv">
              <dt>Business name</dt>
              <dd>{wizard.business?.name || '—'}</dd>
              <dt>Package</dt>
              <dd>{wizard.packageId}</dd>
              <dt>Categories</dt>
              <dd>
                {[wizard.taxonomy?.gmbPrimary, ...(wizard.taxonomy?.gmbAdditional ?? [])]
                  .filter(Boolean)
                  .join(', ') || '—'}
                {wizard.taxonomy?.birdeyeCategory ? ` · Birdeye: ${wizard.taxonomy.birdeyeCategory}` : ''}
              </dd>
              <dt>Services</dt>
              <dd>{wizard.taxonomy?.services || '—'}</dd>
              <dt>Status</dt>
              <dd>
                {wizard.status}
                {wizard.provisioning?.runStatus ? ` · run ${wizard.provisioning.runStatus}` : ''}
                {wizard.provisioning?.mode ? ` · ${wizard.provisioning.mode}` : ''}
              </dd>
              <dt>Last saved</dt>
              <dd>{obRow ? fmt.format(obRow.updatedAt) : '—'}</dd>
            </dl>
          ) : (
            <p className="gh-ops-meta">Not started.</p>
          )}
        </section>

        {/* ── Bookings + thread ──────────────────────────────────────────── */}
        <section className="gh-ops-section">
          <h2>Bookings ({bookings.length})</h2>
          {bookings.length === 0 ? (
            <p className="gh-ops-meta">No service requests yet.</p>
          ) : (
            <div>
              {bookings.map((b) => {
                const slots = parseSlots(b.preferredSlots);
                return (
                  <div key={b.id} className="gh-ops-booking">
                    <div className="gh-ops-booking-hd">
                      <div>
                        <strong>{b.serviceTitle}</strong>{' '}
                        <span className="gh-ops-meta">#{b.id} · {fmt.format(b.requestedAt)}</span>
                      </div>
                      <span className={`gh-ops-status status-${b.status}`}>{b.status.replace('_', ' ')}</span>
                    </div>
                    <dl className="gh-ops-kv" style={{ marginTop: 6 }}>
                      <dt>Need</dt>
                      <dd>{needLabel(b.need)}</dd>
                      <dt>Availability</dt>
                      <dd>{slots.length ? slots.map(formatSlot).join('; ') : b.datePreference ?? '—'}</dd>
                      {b.notes && (
                        <>
                          <dt>Member notes</dt>
                          <dd style={{ whiteSpace: 'pre-wrap' }}>{b.notes}</dd>
                        </>
                      )}
                      {b.strategistSlug && (
                        <>
                          <dt>Routed to</dt>
                          <dd>{b.strategistSlug}</dd>
                        </>
                      )}
                      {b.scheduledAt && (
                        <>
                          <dt>Scheduled</dt>
                          <dd>{fmt.format(b.scheduledAt)}</dd>
                        </>
                      )}
                      {b.completedAt && (
                        <>
                          <dt>Completed</dt>
                          <dd>{fmt.format(b.completedAt)}</dd>
                        </>
                      )}
                      {b.statusChangedBy && (
                        <>
                          <dt>Last change</dt>
                          <dd>
                            {b.statusChangedBy}
                            {b.statusChangedAt ? ` · ${fmt.format(b.statusChangedAt)}` : ''}
                          </dd>
                        </>
                      )}
                      {b.preSessionNotes && (
                        <>
                          <dt>Prep notes</dt>
                          <dd style={{ whiteSpace: 'pre-wrap' }}>{b.preSessionNotes}</dd>
                        </>
                      )}
                    </dl>
                    <BookingActions
                      id={b.id}
                      currentStatus={b.status as 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'}
                      preSessionNotes={b.preSessionNotes}
                      outcome={b.outcome}
                      nextStep={b.nextStep}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <h2 style={{ marginTop: 22 }}>Message thread ({thread.length})</h2>
          {thread.length === 0 ? (
            <p className="gh-ops-meta">No messages yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
              {thread.slice(-30).map((m) => (
                <div
                  key={m.id}
                  className="gh-msg-bubble"
                  style={m.fromTeam ? undefined : { background: 'var(--lime)', marginLeft: 'auto', maxWidth: '85%' }}
                >
                  <span className="who">
                    {m.fromTeam ? m.authorName ?? 'Growth Hub Team' : 'Member'} · {fmt.format(m.createdAt)}
                  </span>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                </div>
              ))}
            </div>
          )}
          <p style={{ marginTop: 10 }}>
            <Link href={`/ops/inbox/${encodeURIComponent(userId)}`} className="gh-btn ghost" style={{ fontSize: 12 }}>
              Reply in thread →
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
