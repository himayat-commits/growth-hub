import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { requireSubscription } from "@/lib/subscription";
import { PLANS, type PlanTier } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Welcome to Growth Hub — Getting Started",
  description: "Your Growth Hub subscription is active. Here's everything you need to hit the ground running.",
};

// Community + resource links — update these once the real URLs are confirmed.
const COMMUNITY_LINKS = [
  { label: "Slack", href: "https://himayat.slack.com", icon: SlackIcon },
  { label: "Facebook", href: "https://facebook.com/groups/growthhub", icon: FacebookIcon },
  { label: "WhatsApp", href: "https://chat.whatsapp.com/growthhub", icon: WhatsAppIcon },
];

const ONBOARDING_VIDEO_URL = "https://himayat.com.au/onboarding-videos";
const WEBINAR_URL = "https://himayat.com.au/weekly-webinar";

// ── SVG Atoms ──────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 7 L6 10.5 L11.5 4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
      <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
      <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
      <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
      <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
      <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
      <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12 L11 14 L15 10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const [sub, user, params] = await Promise.all([
    requireSubscription(),
    currentUser(),
    searchParams,
  ]);

  const planTier = sub.planTier as PlanTier | null;
  const plan = planTier ? PLANS[planTier] : null;
  const firstName = user?.firstName ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const isCheckoutSuccess = params.checkout === "success";

  const price = plan
    ? sub.billingInterval === "year"
      ? plan.monthlyPrice * 10
      : plan.monthlyPrice
    : null;

  const billingLabel =
    sub.billingInterval === "year"
      ? "Billed annually · 2 months free"
      : "Billed monthly · No lock-in";

  return (
    <main className="signup-main">
      <div className="wrap">

        {/* ── Congratulations banner (checkout=success only) ── */}
        {isCheckoutSuccess && (
          <div className="ob-banner" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4 12 14.01l-3-3" />
            </svg>
            <span>
              Subscription confirmed — welcome to Growth Hub
              {firstName ? `, ${firstName}` : ""}!
            </span>
          </div>
        )}

        <Link className="signup-back" href="/#packages">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M11 7H3M7 3 3 7l4 4" />
          </svg>
          Back to packages
        </Link>

        <div className="signup-grid">

          {/* ── LEFT: Plan summary ── */}
          <aside className="signup-summary">
            <div className="signup-eyebrow">Your plan</div>
            <h1 className="signup-title">
              {plan?.tagline ?? "Welcome to Growth Hub."}
            </h1>
            <p className="signup-tagline">
              You&rsquo;re now part of the Growth Hub community.
            </p>

            <div className="signup-pricecard featured">
              {price !== null && (
                <div className="signup-price">
                  ${price.toLocaleString()}
                  <span className="unit">
                    {sub.billingInterval === "year" ? "/year" : "/month"}
                  </span>
                </div>
              )}
              <p className="signup-terms">{billingLabel}</p>

              {plan && (
                <>
                  <hr className="signup-divider" />
                  <ul className="signup-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {plan.addOnNote && (
                    <p className="signup-addon">{plan.addOnNote}</p>
                  )}
                </>
              )}
            </div>

            <div className="signup-trust">
              <div className="signup-trust-item">
                <ShieldIcon />
                <span>No lock-in. Cancel anytime — no exit fees, no awkward conversations.</span>
              </div>
              <div className="signup-trust-item">
                <ClockIcon />
                <span>We reply in 1 business day. Usually faster — real humans in Canberra.</span>
              </div>
              <div className="signup-trust-item">
                <PeopleIcon />
                <span>Backed by Himayat — a Social Traders Verified social enterprise.</span>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: What happens next ── */}
          <div className="signup-formwrap">
            <div className="signup-form-head">
              <p className="signup-form-eyebrow">You&rsquo;re in</p>
              <h2 className="signup-form-title">
                Welcome to Growth Hub
                {firstName ? `, ${firstName}` : ""}.
              </h2>
              <p className="signup-form-sub">
                {plan ? `Your ${plan.name} subscription is active.` : "Your subscription is active."}{" "}
                Here&rsquo;s how to hit the ground running.
              </p>
            </div>

            <ol className="ob-steps">
              {/* Auto-completed */}
              <li className="ob-step done">
                <span className="ob-step-icon" aria-label="Complete">
                  <CheckIcon />
                </span>
                <div className="ob-step-body">
                  <span className="ob-step-label">Stripe subscription active</span>
                  {plan && (
                    <p className="ob-step-sub">{plan.name} · {billingLabel.toLowerCase()}</p>
                  )}
                </div>
              </li>

              <li className="ob-step done">
                <span className="ob-step-icon" aria-label="Complete">
                  <CheckIcon />
                </span>
                <div className="ob-step-body">
                  <span className="ob-step-label">Community invitation sent</span>
                  {email && (
                    <p className="ob-step-sub">Check {email} for your welcome email.</p>
                  )}
                </div>
              </li>

              {/* Action items */}
              <li className="ob-step next">
                <span className="ob-step-icon" aria-label="Next step">
                  <ArrowIcon />
                </span>
                <div className="ob-step-body">
                  <span className="ob-step-label">Join the community</span>
                  <p className="ob-step-sub">Connect with other local business owners in your network.</p>
                  <div className="ob-chips">
                    {COMMUNITY_LINKS.map(({ label, href, icon: Icon }) => (
                      <a
                        key={label}
                        className="ob-chip"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </li>

              <li className="ob-step next">
                <span className="ob-step-icon" aria-label="Next step">
                  <ArrowIcon />
                </span>
                <div className="ob-step-body">
                  <span className="ob-step-label">
                    <a href={ONBOARDING_VIDEO_URL} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                      Watch your onboarding videos →
                    </a>
                  </span>
                  <p className="ob-step-sub">Short, plain-English walkthroughs for every module in your plan. Watch at your own pace.</p>
                </div>
              </li>

              <li className="ob-step next">
                <span className="ob-step-icon" aria-label="Next step">
                  <ArrowIcon />
                </span>
                <div className="ob-step-body">
                  <span className="ob-step-label">
                    <a href={WEBINAR_URL} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                      Your first live webinar — every week →
                    </a>
                  </span>
                  <p className="ob-step-sub">Part training, part Q&amp;A, part community hangout. Bring your questions.</p>
                </div>
              </li>

              <li className="ob-step next">
                <span className="ob-step-icon" aria-label="Next step">
                  <ArrowIcon />
                </span>
                <div className="ob-step-body">
                  <span className="ob-step-label">
                    <Link href="/dashboard" style={{ color: "inherit" }}>
                      Manage your subscription →
                    </Link>
                  </span>
                  <p className="ob-step-sub">View billing details, change plans, or manage add-ons from your dashboard.</p>
                </div>
              </li>
            </ol>

            <div className="ob-footer">
              Questions?{" "}
              <a href="mailto:hello@himayat.com.au">hello@himayat.com.au</a>
              {" · "}
              <a href="tel:0251190005">02 5119 0005</a>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
