"use client";

import { useState } from "react";

export interface FAQItem {
  q: string;
  a: string;
}

const DEFAULT_ITEMS: FAQItem[] = [
  {
    q: "Who is Growth Hub for?",
    a: "Growth Hub is built for local, location-based businesses: anyone selling a physical product or service in their area. We work with cafes, trades, clinics, retail shops, salons, and more. Our tools and community are especially valuable for diverse business owners who may be navigating digital marketing for the first time.",
  },
  {
    q: "How is Growth Hub different from a regular digital agency?",
    a: "We're a Social Traders Verified social enterprise. That means your subscription doesn't just grow your business; it directly funds employment pathways and digital inclusion programs for people in your community. Plus, our support model is built around community (weekly webinars, peer groups, events), not billable hours.",
  },
  {
    q: "Can I upgrade my package later?",
    a: "Yes. Self-service tiers (Foundations, Growth, Accelerate) have no lock-in. You can upgrade anytime and your new modules activate immediately. Managed tiers have a 6-month minimum commitment.",
  },
  {
    q: "What happens in the first month?",
    a: "You get access to onboarding videos for every module in your tier, an invitation to the community groups (Slack, Facebook, WhatsApp), and your first weekly webinar. Managed tier clients also receive a dedicated onboarding call, and Managed Pro/Elite clients get first-month brand and website setup included.",
  },
  {
    q: "What are Managed Service Packages?",
    a: "Managed Pro and Managed Elite are \"done for you\" tiers where our team actively runs your digital marketing: social posts, review responses, strategy calls, SEO, and more. You get full platform access plus a dedicated account manager.",
  },
  {
    q: "What is Agentic AI?",
    a: "Most of the modules powering Growth Hub use Agentic AI, meaning the AI doesn't just suggest actions, it takes them. It writes and publishes social posts, responds to reviews, manages your listings, and captures leads via webchat, all on your behalf.",
  },
  {
    q: "How do I learn to use the platform?",
    a: "Every subscriber gets access to our on-demand onboarding video library: short, plain-English walkthroughs covering every feature. You can learn at your own pace, rewatch anytime from your subscriber portal, and new videos unlock as you activate more tools. Prefer learning live? Our weekly subscriber webinar covers the same ground with a real person on the other end of your questions.",
  },
];

interface FAQProps {
  items?: FAQItem[] | null;
}

export default function FAQ({ items }: FAQProps = {}) {
  const resolvedItems = items && items.length > 0 ? items : DEFAULT_ITEMS;
  const [open, setOpen] = useState<number>(0);

  return (
    <section id="faq">
      <div className="wrap">
        <div className="faq-grid">
          <div>
            <span className="section-label">FAQ</span>
            <h2 className="section-h2">
              Common<br />questions.
            </h2>
            <p className="section-lead">
              Can't find what you need? Email{" "}
              <a style={{ textDecoration: "underline" }} href="mailto:hello@himayat.com.au">
                hello@himayat.com.au
              </a>{" "}
              — a real person replies within 48 hours.
            </p>
          </div>

          <div className="faq-list">
            {resolvedItems.map((it, i) => (
              <div className={`faq-item ${open === i ? "open" : ""}`} key={i}>
                <button
                  className="faq-q"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                >
                  <span>{it.q}</span>
                  <span className="plus">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M2 7h10M7 2v10" />
                    </svg>
                  </span>
                </button>
                <div className="faq-a">
                  <div>
                    <p>{it.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
