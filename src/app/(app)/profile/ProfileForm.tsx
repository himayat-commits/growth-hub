'use client';

// Client form for /profile. Mirrors the mockup's three-section layout:
// Personal info (mostly read-only — name + email come from WorkOS),
// About your business, and Notifications & email. All edits PUT to
// /api/profile in a single batch.

import { useRef, useState } from 'react';
import type { UserProfile } from '@/lib/db/schema';

const PHOTO_MAX_BYTES = 4 * 1024 * 1024; // mirror /api/profile/photo
const PHOTO_ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface Props {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  initials: string;
  memberSince: string; // formatted date string
  planLabel: string;
  profileCompletePct: number;
  initialProfile: UserProfile;
}

const STAGES = [
  { value: '', label: '— pick one —' },
  { value: 'idea', label: 'Just an idea' },
  { value: 'just-starting', label: 'Just starting out' },
  { value: 'running', label: 'Running, want to grow' },
  { value: 'established', label: 'Established, want to scale' },
];

const INDUSTRIES = [
  { value: '', label: '— pick one —' },
  { value: 'retail', label: 'Retail / e-commerce' },
  { value: 'services', label: 'Services' },
  { value: 'food', label: 'Food & hospitality' },
  { value: 'creative', label: 'Creative / design' },
  { value: 'trades', label: 'Trades' },
  { value: 'other', label: 'Other' },
];

const HELP_AREAS = [
  { value: 'website', label: 'Website' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'branding', label: 'Branding' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'systems', label: 'Systems & ops' },
  { value: 'funding', label: 'Funding' },
  { value: 'confidence', label: 'Confidence' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'ne', label: 'नेपाली' },
  { value: 'ur', label: 'اردو' },
];

const NOTIF_ROWS = [
  {
    key: 'notifBooking' as const,
    h: 'Booking confirmations & reminders',
    p: 'Always sent for sessions you’ve booked. We won’t bug you outside of these.',
  },
  {
    key: 'notifLibrary' as const,
    h: 'New resources in the library',
    p: 'A short weekly digest of new guides, templates and recordings.',
  },
  {
    key: 'notifEvents' as const,
    h: 'Upcoming events & webinars',
    p: 'A heads-up on the Monday of each event week.',
  },
  {
    key: 'notifNewsletter' as const,
    h: 'Monthly newsletter',
    p: 'A longer read from our team on what’s working for small operators.',
  },
  {
    key: 'notifReferrals' as const,
    h: 'Referral & credit alerts',
    p: 'We’ll tell you when a referral lands and credit hits your account.',
  },
];

export default function ProfileForm({
  email,
  firstName,
  lastName,
  initials,
  memberSince,
  planLabel,
  profileCompletePct,
  initialProfile,
}: Props) {
  const [businessName, setBusinessName] = useState(initialProfile.businessName ?? '');
  const [businessDescription, setBusinessDescription] = useState(
    initialProfile.businessDescription ?? '',
  );
  const [stage, setStage] = useState(initialProfile.stage ?? '');
  const [industry, setIndustry] = useState(initialProfile.industry ?? '');
  const [city, setCity] = useState(initialProfile.city ?? '');
  const [phone, setPhone] = useState(initialProfile.phone ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState(
    initialProfile.preferredLanguage ?? 'en',
  );
  const [helpAreas, setHelpAreas] = useState<string[]>(initialProfile.helpAreas ?? []);

  const [notif, setNotif] = useState({
    notifBooking: initialProfile.notifBooking,
    notifLibrary: initialProfile.notifLibrary,
    notifEvents: initialProfile.notifEvents,
    notifNewsletter: initialProfile.notifNewsletter,
    notifReferrals: initialProfile.notifReferrals,
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [completePct, setCompletePct] = useState(profileCompletePct);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialProfile.photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_ALLOWED_MIME.has(file.type)) {
      setSaveMsg('Use a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setSaveMsg('Image too large (max 4 MB).');
      return;
    }
    setUploading(true);
    setSaveMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/profile/photo', { method: 'POST', body: fd });
      const data = (await res.json()) as { photoUrl?: string; error?: string };
      if (!res.ok || !data.photoUrl) {
        throw new Error(data.error ?? 'Upload failed');
      }
      setPhotoUrl(data.photoUrl);
      setSaveMsg('Photo updated ✓');
      window.setTimeout(() => setSaveMsg(null), 2400);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleHelpArea = (value: string) => {
    setHelpAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName || null,
          businessDescription: businessDescription || null,
          stage: stage || null,
          industry: industry || null,
          city: city || null,
          phone: phone || null,
          preferredLanguage,
          helpAreas,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Save failed');
      }
      setCompletePct(data.profile.profileCompletePct ?? completePct);
      setSaveMsg('Saved ✓');
      window.setTimeout(() => setSaveMsg(null), 2400);
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Save failed');
      }
      setSaveMsg('Preferences saved ✓');
      window.setTimeout(() => setSaveMsg(null), 2400);
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || email || 'Your account';

  return (
    <>
      <div className="gh-profile-hero">
        <div className="gh-avatar-placeholder">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="gh-profile-hero-body">
          <h2 className="gh-profile-hero-h">{fullName}</h2>
          <div className="gh-profile-hero-meta">
            <span>{email}</span>
            <span className="dot" />
            <span>
              {planLabel} · joined {memberSince}
            </span>
            <span className="dot" />
            <span>Profile {completePct}% complete</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPhotoChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
          <button
            className="gh-btn ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : photoUrl ? 'Change photo' : 'Upload photo'}
          </button>
          <button className="gh-btn" type="button" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div
          role="status"
          style={{
            margin: '0 0 16px',
            padding: '10px 14px',
            borderRadius: 10,
            background: saveMsg.startsWith('Sav') || saveMsg.startsWith('Pref') ? 'var(--lime)' : 'var(--plum-12)',
            color: 'var(--teal)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {saveMsg}
        </div>
      )}

      <div className="gh-grid-2" style={{ alignItems: 'start' }}>
        <div className="gh-form">
          <div className="gh-form-h">Personal info</div>
          <div className="gh-form-grid">
            <div className="gh-field">
              <label>First name</label>
              <input value={firstName ?? ''} disabled />
              <div className="hint">Manage in WorkOS</div>
            </div>
            <div className="gh-field">
              <label>Last name</label>
              <input value={lastName ?? ''} disabled />
              <div className="hint">Manage in WorkOS</div>
            </div>
            <div className="gh-field full">
              <label>Email</label>
              <input value={email ?? ''} disabled />
              <div className="hint">Manage in WorkOS</div>
            </div>
            <div className="gh-field">
              <label>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />
            </div>
            <div className="gh-field">
              <label>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sydney, NSW" />
            </div>
            <div className="gh-field full">
              <label>Preferred language</label>
              <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="gh-form">
          <div className="gh-form-h">About your business</div>
          <div className="gh-form-grid">
            <div className="gh-field full">
              <label>Business or project name</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Aqiq Studio"
              />
            </div>
            <div className="gh-field full">
              <label>
                What do you do? <span className="hint">(One sentence is fine)</span>
              </label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="A short description of who you serve and what you offer."
              />
            </div>
            <div className="gh-field">
              <label>Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="gh-field">
              <label>Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="gh-field full">
              <label>
                What would you like help with first? <span className="hint">(Choose any)</span>
              </label>
              <div className="gh-chips" style={{ marginTop: 2 }}>
                {HELP_AREAS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`gh-chip ${helpAreas.includes(c.value) ? 'is-active' : ''}`}
                    onClick={() => toggleHelpArea(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gh-form">
        <div className="gh-form-h">Notifications &amp; email</div>
        {NOTIF_ROWS.map((row) => (
          <div key={row.key} className="gh-toggle-row">
            <div>
              <div className="gh-toggle-row-h">{row.h}</div>
              <div className="gh-toggle-row-p">{row.p}</div>
            </div>
            <button
              type="button"
              className={`gh-toggle ${notif[row.key] ? 'is-on' : ''}`}
              onClick={() => setNotif((n) => ({ ...n, [row.key]: !n[row.key] }))}
              aria-pressed={notif[row.key]}
              aria-label={`Toggle ${row.h}`}
            />
          </div>
        ))}
        <div className="gh-form-foot">
          <button
            type="button"
            className="gh-btn ghost"
            onClick={() =>
              setNotif({
                notifBooking: true,
                notifLibrary: true,
                notifEvents: true,
                notifNewsletter: false,
                notifReferrals: true,
              })
            }
          >
            Reset
          </button>
          <button type="button" className="gh-btn" onClick={saveNotifications} disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </div>
    </>
  );
}
