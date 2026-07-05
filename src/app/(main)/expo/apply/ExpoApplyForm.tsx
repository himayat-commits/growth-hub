'use client';

import { useId, useMemo, useRef, useState, type ReactNode } from 'react';

// Multi-step application form for the Entrepreneurship for Everyone expo.
// Replaces the embedded HubSpot form: the native embed can't do a staged,
// branching flow, so this collects richer role-specific answers and posts them
// to /api/expo-apply, which forwards into the same HubSpot form + contact
// properties. See that route + scripts/create-expo-hubspot-form.mjs.
//
// The signature moment is the role picker (step 1): tactile cards you toggle
// on, each of which then gets its own tailored question page in the Details
// step. Rich answers are composed into the three existing expo_*_details
// textarea properties, so no new HubSpot schema is needed.

type RoleId = 'host_a_stall' | 'run_a_workshop' | 'help_desk_advisory';

const ROLES: {
  id: RoleId;
  title: string;
  blurb: string;
  icon: ReactNode;
}[] = [
  {
    id: 'host_a_stall',
    title: 'Host a stall',
    blurb: 'Your own table in the expo hall, all day.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V9l8-5 8 5v11" />
        <path d="M9 20v-5h6v5" />
      </svg>
    ),
  },
  {
    id: 'run_a_workshop',
    title: 'Run a workshop',
    blurb: 'Teach a hands-on session that helps businesses grow.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'help_desk_advisory',
    title: 'Help desk or advisory support',
    blurb: 'Staff a one-to-one help desk — planning, getting online, advice.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <line x1="5.6" y1="5.6" x2="9.5" y2="9.5" />
        <line x1="14.5" y1="14.5" x2="18.4" y2="18.4" />
        <line x1="14.5" y1="9.5" x2="18.4" y2="5.6" />
        <line x1="9.5" y1="14.5" x2="5.6" y2="18.4" />
      </svg>
    ),
  },
];

const STEPS = ['Role', 'You', 'Details', 'Send'] as const;

// Choice-chip option sets for the role-specific questions.
const STALL_SIZE = ['Standard table', 'Double space', 'Just a banner & me'];
const WORKSHOP_FORMAT = ['Hands-on', 'Talk + Q&A', 'Panel', 'Live demo'];
const WORKSHOP_LENGTH = ['20 min', '30 min', '45 min', '60 min'];
const WORKSHOP_AUDIENCE = ['Thinking of starting', 'Just started', 'Established'];
const ADVISORY_AREA = ['Getting online', 'Business planning', 'Marketing & branding', 'Finance & funding', 'General advice'];
const ADVISORY_FORMAT = ['One-to-one help desk', 'Group clinic', 'Either'];

// One detail page per selected role — its heading + intro line.
const DETAIL_TITLE: Record<RoleId, string> = {
  host_a_stall: 'Your stall',
  run_a_workshop: 'Your workshop',
  help_desk_advisory: 'Your help desk',
};
const DETAIL_LEDE: Record<RoleId, string> = {
  host_a_stall: 'What you’ll bring to the expo hall.',
  run_a_workshop: 'What you’d teach, and who it’s for.',
  help_desk_advisory: 'The one-to-one help you can offer on the day.',
};

type FormState = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  message: string;
  // stall
  stallShowcase: string;
  stallSize: string;
  stallPower: boolean;
  stallSelling: boolean;
  // workshop
  wsTopic: string;
  wsFormat: string;
  wsLength: string;
  wsAudience: string;
  wsTakeaway: string;
  // help desk / advisory
  adOffer: string;
  adArea: string;
  adFormat: string;
  adBackground: string;
};

const EMPTY: FormState = {
  firstname: '', lastname: '', email: '', phone: '', company: '', website: '', message: '',
  stallShowcase: '', stallSize: '', stallPower: false, stallSelling: false,
  wsTopic: '', wsFormat: '', wsLength: '', wsAudience: '', wsTakeaway: '',
  adOffer: '', adArea: '', adFormat: '', adBackground: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Compose the rich per-role answers into the three textarea properties HubSpot
// already has. Only non-empty lines are included; required topics always lead.
function buildStallDetails(f: FormState) {
  return [
    f.stallShowcase && `What I'll showcase: ${f.stallShowcase}`,
    f.stallSize && `Stall size: ${f.stallSize}`,
    `Power needed: ${f.stallPower ? 'Yes' : 'No'}`,
    `Selling on the day: ${f.stallSelling ? 'Yes' : 'No'}`,
  ].filter(Boolean).join('\n');
}
function buildWorkshopDetails(f: FormState) {
  return [
    f.wsTopic && `Topic: ${f.wsTopic}`,
    f.wsFormat && `Format: ${f.wsFormat}`,
    f.wsLength && `Length: ${f.wsLength}`,
    f.wsAudience && `Best for: ${f.wsAudience}`,
    f.wsTakeaway && `People will leave able to: ${f.wsTakeaway}`,
  ].filter(Boolean).join('\n');
}
function buildAdvisoryDetails(f: FormState) {
  return [
    f.adOffer && `Can help with: ${f.adOffer}`,
    f.adArea && `Main area: ${f.adArea}`,
    f.adFormat && `Format: ${f.adFormat}`,
    f.adBackground && `Background: ${f.adBackground}`,
  ].filter(Boolean).join('\n');
}

export default function ExpoApplyForm() {
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<RoleId[]>([]);
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [submitError, setSubmitError] = useState('');
  const hp = useRef(''); // honeypot
  const formTop = useRef<HTMLDivElement>(null);
  const uid = useId();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const toggleRole = (id: RoleId) => {
    setRoles((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
    if (errors.roles) setErrors((e) => ({ ...e, roles: '' }));
  };

  const selectedRoles = useMemo(
    () => ROLES.filter((r) => roles.includes(r.id)),
    [roles],
  );

  // The flow is dynamic: Role → You → one Details page per selected role → Send.
  // The four-dot rail stays fixed (Role / You / Details / Send); the Details dot
  // spans every per-role page, which paginate "n of N".
  const steps = useMemo(
    () => [
      { kind: 'role' as const },
      { kind: 'you' as const },
      ...selectedRoles.map((r) => ({ kind: 'detail' as const, role: r })),
      { kind: 'send' as const },
    ],
    [selectedRoles],
  );
  const current = steps[Math.min(step, steps.length - 1)];
  const phase =
    current.kind === 'role' ? 0 : current.kind === 'you' ? 1 : current.kind === 'send' ? 3 : 2;

  const focusTop = () => {
    // Move focus + scroll to the form heading so each step starts at the top
    // and screen-reader users land on the new step's title.
    requestAnimationFrame(() => formTop.current?.focus());
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    const st = steps[s];
    if (st?.kind === 'role' && roles.length === 0) {
      e.roles = 'Pick at least one — you can choose more than one.';
    }
    if (st?.kind === 'you') {
      if (!f.firstname.trim()) e.firstname = 'Required';
      if (!f.lastname.trim()) e.lastname = 'Required';
      if (!f.email.trim() || !EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email';
      if (!f.company.trim()) e.company = 'Required';
    }
    if (st?.kind === 'detail') {
      if (st.role.id === 'host_a_stall' && !f.stallShowcase.trim())
        e.stallShowcase = 'Tell us what you’d showcase';
      if (st.role.id === 'run_a_workshop' && !f.wsTopic.trim())
        e.wsTopic = 'Give your workshop a topic';
      if (st.role.id === 'help_desk_advisory' && !f.adOffer.trim())
        e.adOffer = 'Tell us what you can help with';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
    focusTop();
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    setSubmitError('');
    focusTop();
  };

  const submit = async () => {
    // Re-validate every detail page; jump back to the first with a gap.
    for (let i = 2; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i);
        focusTop();
        return;
      }
    }
    setStatus('sending');
    setSubmitError('');
    try {
      const res = await fetch('/api/expo-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: f.firstname,
          lastname: f.lastname,
          email: f.email,
          phone: f.phone,
          company: f.company,
          website: f.website,
          message: f.message,
          roles,
          expo_stall_details: roles.includes('host_a_stall') ? buildStallDetails(f) : '',
          expo_workshop_details: roles.includes('run_a_workshop') ? buildWorkshopDetails(f) : '',
          expo_speaker_details: roles.includes('help_desk_advisory') ? buildAdvisoryDetails(f) : '',
          hp: hp.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || 'Something went wrong — try again.');
        setStatus('idle');
        return;
      }
      setStatus('done');
      focusTop();
    } catch {
      setSubmitError('Could not reach the server — check your connection and try again.');
      setStatus('idle');
    }
  };

  // ---- Success state -------------------------------------------------------
  if (status === 'done') {
    return (
      <div className="xa" ref={formTop} tabIndex={-1}>
        <div className="xa-done">
          <div className="xa-done-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="xa-done-eyebrow">Application in</p>
          <h2 className="xa-done-title">
            Thanks, {f.firstname || 'friend'} — we’ve got it.
          </h2>
          <p className="xa-done-sub">
            We read every application ourselves and we’ll reply within a few
            business days from <b>hello@himayat.com.au</b>. Keep an eye on your
            inbox{f.email ? <> at <b>{f.email}</b></> : ''}.
          </p>
          <ul className="xa-done-roles">
            {selectedRoles.map((r) => (
              <li key={r.id}>
                <span className="xa-done-roleicon" aria-hidden="true">{r.icon}</span>
                {r.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ---- Progress rail -------------------------------------------------------
  const rail = (
    <ol className="xa-rail" aria-label="Application progress">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`xa-rail-step${i === phase ? ' is-current' : ''}${i < phase ? ' is-done' : ''}`}
          aria-current={i === phase ? 'step' : undefined}
        >
          <span className="xa-rail-dot" aria-hidden="true">
            {i < phase ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              i + 1
            )}
          </span>
          <span className="xa-rail-label">{label}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="xa">
      {rail}

      {/* Honeypot — visually hidden, off-screen, not announced. */}
      <div className="xa-hp" aria-hidden="true">
        <label htmlFor={`${uid}-company2`}>Leave this field empty</label>
        <input
          id={`${uid}-company2`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => (hp.current = e.target.value)}
        />
      </div>

      <div className="xa-stepwrap" ref={formTop} tabIndex={-1}>
        {/* STEP 1 — Role picker (the signature element) */}
        {step === 0 && (
          <div className="xa-step" key="role">
            <p className="xa-eyebrow">Step 1 · How you’ll join us</p>
            <h2 className="xa-title">Pick your part in the day.</h2>
            <p className="xa-lede">
              Choose one — or more. Each one you tick adds a short, tailored set
              of questions later, so we only ask what matters.
            </p>

            <div className="xa-rolegrid" role="group" aria-label="Ways to take part">
              {ROLES.map((r) => {
                const on = roles.includes(r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={`xa-rolecard${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleRole(r.id)}
                  >
                    <span className="xa-rolecard-tick" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    <span className="xa-rolecard-icon" aria-hidden="true">{r.icon}</span>
                    <span className="xa-rolecard-title">{r.title}</span>
                    <span className="xa-rolecard-blurb">{r.blurb}</span>
                  </button>
                );
              })}
            </div>
            {errors.roles && <p className="xa-error xa-error--block">{errors.roles}</p>}
          </div>
        )}

        {/* STEP 2 — About you */}
        {step === 1 && (
          <div className="xa-step" key="about">
            <p className="xa-eyebrow">Step 2 · About you</p>
            <h2 className="xa-title">Nice to meet you.</h2>
            <p className="xa-lede">The basics, so we know who we’re talking to.</p>

            <div className="xa-fields">
              <div className="xa-row">
                <Field id={`${uid}-fn`} label="First name" required error={errors.firstname}>
                  <input id={`${uid}-fn`} className="xa-input" value={f.firstname} autoComplete="given-name"
                    onChange={(e) => set('firstname', e.target.value)} />
                </Field>
                <Field id={`${uid}-ln`} label="Last name" required error={errors.lastname}>
                  <input id={`${uid}-ln`} className="xa-input" value={f.lastname} autoComplete="family-name"
                    onChange={(e) => set('lastname', e.target.value)} />
                </Field>
              </div>
              <Field id={`${uid}-em`} label="Email" required error={errors.email}>
                <input id={`${uid}-em`} className="xa-input" type="email" value={f.email} autoComplete="email"
                  onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field id={`${uid}-co`} label="Business or organisation" required error={errors.company}>
                <input id={`${uid}-co`} className="xa-input" value={f.company} autoComplete="organization"
                  onChange={(e) => set('company', e.target.value)} />
              </Field>
              <div className="xa-row">
                <Field id={`${uid}-ph`} label="Phone" hint="optional">
                  <input id={`${uid}-ph`} className="xa-input" type="tel" value={f.phone} autoComplete="tel"
                    onChange={(e) => set('phone', e.target.value)} />
                </Field>
                <Field id={`${uid}-web`} label="Website or social" hint="optional">
                  <input id={`${uid}-web`} className="xa-input" value={f.website} placeholder="@handle or link"
                    onChange={(e) => set('website', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — one tailored page per selected role */}
        {current.kind === 'detail' && (
          <div className="xa-step" key={`detail-${current.role.id}`}>
            <p className="xa-eyebrow">
              Step 3 · The good stuff
              {selectedRoles.length > 1 ? ` · ${step - 1} of ${selectedRoles.length}` : ''}
            </p>
            <h2 className="xa-title">{DETAIL_TITLE[current.role.id]}</h2>
            <p className="xa-lede">{DETAIL_LEDE[current.role.id]}</p>

            <div className="xa-fields">
              {current.role.id === 'host_a_stall' && (
                <>
                  <Field id={`${uid}-st1`} label="What would you showcase?" required error={errors.stallShowcase}>
                    <textarea id={`${uid}-st1`} className="xa-input xa-textarea" rows={3} value={f.stallShowcase}
                      placeholder="Your product or service, and what visitors will see at your table."
                      onChange={(e) => set('stallShowcase', e.target.value)} />
                  </Field>
                  <Chips label="How much space?" options={STALL_SIZE} value={f.stallSize}
                    onPick={(v) => set('stallSize', v)} />
                  <div className="xa-toggles">
                    <Toggle label="I’ll need power at my stall" checked={f.stallPower}
                      onChange={(v) => set('stallPower', v)} />
                    <Toggle label="I’d like to sell on the day" checked={f.stallSelling}
                      onChange={(v) => set('stallSelling', v)} />
                  </div>
                </>
              )}

              {current.role.id === 'run_a_workshop' && (
                <>
                  <Field id={`${uid}-ws1`} label="Workshop topic or title" required error={errors.wsTopic}>
                    <input id={`${uid}-ws1`} className="xa-input" value={f.wsTopic}
                      placeholder="e.g. “Pricing your first product without the fear”"
                      onChange={(e) => set('wsTopic', e.target.value)} />
                  </Field>
                  <Chips label="Format" options={WORKSHOP_FORMAT} value={f.wsFormat}
                    onPick={(v) => set('wsFormat', v)} />
                  <Chips label="How long?" options={WORKSHOP_LENGTH} value={f.wsLength}
                    onPick={(v) => set('wsLength', v)} />
                  <Chips label="Best for" options={WORKSHOP_AUDIENCE} value={f.wsAudience}
                    onPick={(v) => set('wsAudience', v)} />
                  <Field id={`${uid}-ws2`} label="What will people leave able to do?" hint="optional">
                    <textarea id={`${uid}-ws2`} className="xa-input xa-textarea" rows={2} value={f.wsTakeaway}
                      placeholder="The one practical thing they’ll walk away with."
                      onChange={(e) => set('wsTakeaway', e.target.value)} />
                  </Field>
                </>
              )}

              {current.role.id === 'help_desk_advisory' && (
                <>
                  <Field id={`${uid}-ad1`} label="What can you help people with?" required error={errors.adOffer}>
                    <textarea id={`${uid}-ad1`} className="xa-input xa-textarea" rows={2} value={f.adOffer}
                      placeholder="The kind of one-to-one help you can offer at a help desk."
                      onChange={(e) => set('adOffer', e.target.value)} />
                  </Field>
                  <Chips label="Main area" options={ADVISORY_AREA} value={f.adArea}
                    onPick={(v) => set('adArea', v)} />
                  <Chips label="How you’d help" options={ADVISORY_FORMAT} value={f.adFormat}
                    onPick={(v) => set('adFormat', v)} />
                  <Field id={`${uid}-ad2`} label="Your advisory background" hint="optional">
                    <textarea id={`${uid}-ad2`} className="xa-input xa-textarea" rows={2} value={f.adBackground}
                      placeholder="How you’ve helped small businesses before — or “first-timer, keen to help”."
                      onChange={(e) => set('adBackground', e.target.value)} />
                  </Field>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 — Review & send */}
        {current.kind === 'send' && (
          <div className="xa-step" key="review">
            <p className="xa-eyebrow">Step 4 · One last look</p>
            <h2 className="xa-title">Ready to send?</h2>
            <p className="xa-lede">Here’s what we’ll receive. Edit anything by stepping back.</p>

            <dl className="xa-review">
              <div className="xa-review-row">
                <dt>You</dt>
                <dd>{f.firstname} {f.lastname} · {f.email}{f.company ? <> · {f.company}</> : null}</dd>
              </div>
              <div className="xa-review-row">
                <dt>Taking part as</dt>
                <dd>{selectedRoles.map((r) => r.title).join(' · ') || '—'}</dd>
              </div>
            </dl>

            <Field id={`${uid}-msg`} label="Anything else we should know?" hint="optional">
              <textarea id={`${uid}-msg`} className="xa-input xa-textarea" rows={3} value={f.message}
                placeholder="Access needs, timing constraints, a question for us — anything."
                onChange={(e) => set('message', e.target.value)} />
            </Field>

            <p className="xa-consent">
              By applying you’re happy for us to contact you about this event. We
              never share your details.
            </p>
            {submitError && <p className="xa-error xa-error--block">{submitError}</p>}
          </div>
        )}
      </div>

      {/* ---- Footer controls ---- */}
      <div className="xa-controls">
        {step > 0 ? (
          <button type="button" className="xa-btn xa-btn--ghost" onClick={back} disabled={status === 'sending'}>
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step < steps.length - 1 ? (
          <button type="button" className="xa-btn xa-btn--primary" onClick={next}>
            Continue →
          </button>
        ) : (
          <button type="button" className="xa-btn xa-btn--primary" onClick={submit} disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Small presentational helpers -----------------------------------------

function Field({
  id, label, required, hint, error, children,
}: {
  id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode;
}) {
  return (
    <div className={`xa-field${error ? ' has-error' : ''}`}>
      <label className="xa-label" htmlFor={id}>
        {label}
        {required && <span className="xa-req" aria-hidden="true"> *</span>}
        {hint && <span className="xa-hint"> · {hint}</span>}
      </label>
      {children}
      {error && <span className="xa-error">{error}</span>}
    </div>
  );
}

function Chips({
  label, options, value, onPick,
}: {
  label: string; options: string[]; value: string; onPick: (v: string) => void;
}) {
  return (
    <div className="xa-field">
      <span className="xa-label">{label}</span>
      <div className="xa-chips" role="group" aria-label={label}>
        {options.map((opt) => {
          const on = value === opt;
          return (
            <button
              type="button"
              key={opt}
              className={`xa-chip${on ? ' is-on' : ''}`}
              aria-pressed={on}
              // Tapping the active chip clears it — these are all optional.
              onClick={() => onPick(on ? '' : opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`xa-toggle${checked ? ' is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="xa-toggle-track" aria-hidden="true"><span className="xa-toggle-thumb" /></span>
      <span className="xa-toggle-label">{label}</span>
    </button>
  );
}
