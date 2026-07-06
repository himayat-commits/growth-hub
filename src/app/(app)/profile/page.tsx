import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';
import { PLANS } from '@/lib/plans';
import SignOutButton from '@/components/SignOutButton';
import ProfileForm from './ProfileForm';
import { getStrategistBySlug } from '@/lib/cms';
import type { Media } from '@/payload-types';

export const metadata: Metadata = {
  title: 'Profile & settings — Growth Hub',
};

function makeInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export default async function ProfilePage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/profile');

  // Ensure the profile row exists before we load it — defensive, harmless if
  // already present. Same idempotent helper as /auth/callback.
  const profile = await ensureUserRecord({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const [sub, strategist] = await Promise.all([
    getSubscription(),
    profile.assignedStrategistId
      ? getStrategistBySlug(profile.assignedStrategistId)
      : Promise.resolve(null),
  ]);
  const tier = getEffectivePlan(sub);
  const planLabel = `${PLANS[tier].name}${tier === 'free' ? '' : ' plan'}`;
  const strategistPhotoUrl =
    strategist?.photo && typeof strategist.photo === 'object'
      ? (strategist.photo as Media).url ?? null
      : null;
  const strategistInitials = strategist?.name
    ? strategist.name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'GH';

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '';
  const memberSince = new Intl.DateTimeFormat('en-AU', { dateStyle: 'long' }).format(
    profile.createdAt,
  );

  return (
    <>
      <PageHeader
        kicker="Account"
        title="Profile & settings"
        sub="Tell us a little more about you and how you want to hear from us. You can change anything here later."
      />

      <ProfileForm
        email={user.email ?? null}
        firstName={user.firstName ?? null}
        lastName={user.lastName ?? null}
        initials={makeInitials(fullName, user.email)}
        memberSince={memberSince}
        planLabel={planLabel}
        profileCompletePct={profile.profileCompletePct}
        initialProfile={profile}
      />

      {/* Your strategist card */}
      <div className="gh-form">
        <div className="gh-form-h">Your Growth Strategist</div>
        {strategist ? (
          <div className="gh-strategist-card">
            <div className="gh-strategist-avatar">
              {strategistPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={strategistPhotoUrl} alt={strategist.name} />
              ) : (
                <span>{strategistInitials}</span>
              )}
            </div>
            <div className="gh-strategist-info">
              <div className="gh-strategist-name">{strategist.name}</div>
              <div className="gh-strategist-role">{strategist.role}</div>
              <div className="gh-strategist-links">
                <a href={`mailto:${strategist.email}`} className="gh-strategist-link">
                  {strategist.email}
                </a>
                {strategist.calendlyUrl && (
                  <a
                    href={strategist.calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-btn ghost"
                    style={{ fontSize: 13, padding: '6px 14px' }}
                  >
                    Book a call →
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="gh-toggle-row-p" style={{ margin: 0 }}>
            You&apos;ll be matched with a Growth Strategist once you complete your profile and book
            your first Growth Call.
          </p>
        )}
      </div>

      <div className="gh-form">
        <div className="gh-form-h">Security &amp; sign-in</div>
        <p className="gh-toggle-row-p" style={{ margin: '0 0 18px' }}>
          Sign-in details (email, password, two-step verification) are managed by WorkOS.
          You can update them from your WorkOS account.
        </p>
        <div className="gh-form-foot">
          <a
            className="gh-btn ghost"
            href="https://workos.com/account"
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage on WorkOS →
          </a>
          <SignOutButton className="gh-btn" />
        </div>
      </div>

      <div className="gh-form">
        <div className="gh-form-h" style={{ color: 'var(--plum)' }}>
          Delete account
        </div>
        <p className="gh-toggle-row-p">
          Deletion is a manual step right now — email{' '}
          <a href="mailto:hello@himayat.com.au">hello@himayat.com.au</a> and we&apos;ll wipe your
          data within 7 days, including any Birdeye account we&apos;ve provisioned. Active Stripe
          subscriptions will be cancelled with a pro-rated refund.
        </p>
      </div>
    </>
  );
}
