"use client";

// Free-tier deliverable. Reads the wizard answers (report mode) and renders
// a personalised local-growth action plan, ending in a Foundations upgrade
// CTA. Deterministic/templated — no LLM dependency. Printable to PDF via the
// browser (print:hidden hides the chrome). Lives under /onboarding so it sits
// inside the WizardProvider and can read state via useWizard().

import * as React from "react";
import Link from "next/link";
import { useWizard } from "@/components/wizard/WizardContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pill,
  SectionLabel,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { PACKAGES } from "@/lib/wizard/packages";
import {
  ArrowRight,
  Check,
  Megaphone,
  MessageSquare,
  Printer,
  Star,
} from "lucide-react";

export function ActionPlanReport() {
  const { state } = useWizard();

  const viewFired = React.useRef(false);
  React.useEffect(() => {
    if (viewFired.current) return;
    viewFired.current = true;
    track("onboarding_action_plan_view");
  }, []);

  const biz = state.business.name?.trim() || "Your business";
  const city = state.address.city?.trim();
  const category =
    state.taxonomy.gmbPrimary?.trim() ||
    state.taxonomy.birdeyeCategory?.trim() ||
    "your industry";
  const usp = state.about.usp?.trim();
  const ideal = state.about.idealCustomer?.trim();
  const foundations = PACKAGES.foundations;

  const hasGoogle = !!state.social.google;
  const hasFacebook = !!state.social.facebook;
  const hasInstagram = !!state.social.instagram;
  const hasWebsite = !!state.address.websiteUrl;

  const channels = [
    { name: "Google Business Profile", ok: hasGoogle },
    { name: "Facebook", ok: hasFacebook },
    { name: "Instagram", ok: hasInstagram },
    { name: "Website", ok: hasWebsite },
  ];

  const recommendations: { tag: string; title: string; detail: string; icon: React.ReactNode }[] = [
    {
      tag: "Listing AI",
      icon: <Star className="h-4 w-4 text-teal" />,
      title: "Lock down your business listings",
      detail: `Make sure ${biz}'s name, address, hours and phone are identical across Google, Apple Maps, Facebook and 50+ directories${
        city ? ` — so ${city} customers searching for "${category}" always get the right details` : ""
      }.`,
    },
    ...(!hasGoogle
      ? [
          {
            tag: "Listing AI",
            icon: <Star className="h-4 w-4 text-teal" />,
            title: "Claim your Google Business Profile",
            detail: `You didn't list a Google profile — it's the single biggest driver of local discovery. Claiming and optimising it puts ${biz} on Maps and in the local pack.`,
          },
        ]
      : []),
    {
      tag: "Reviews AI",
      icon: <Star className="h-4 w-4 text-teal" />,
      title: "Turn happy customers into reviews",
      detail: `Send an automatic review request after every job, and put a QR card on the counter. A steady flow of 5-star reviews builds the trust that converts ${
        ideal || "new customers"
      }.`,
    },
    {
      tag: "Social AI",
      icon: <Megaphone className="h-4 w-4 text-teal" />,
      title: hasFacebook || hasInstagram ? "Keep your social channels active" : "Get consistent on social",
      detail: `Schedule 3–4 AI-written posts a week so ${biz} stays top of mind${
        usp ? `. Lead with what sets you apart: ${usp}` : ""
      }.`,
    },
    {
      tag: "Messaging",
      icon: <MessageSquare className="h-4 w-4 text-teal" />,
      title: "Reply to every enquiry in one place",
      detail:
        "Bring Facebook, Google, SMS and webchat messages into one shared inbox so no lead slips through the cracks.",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-2 pb-12 md:px-6 md:pt-4">
      <PageHeader
        kicker="Your action plan"
        title={`${biz}'s action plan`}
        sub={`Built from your answers — here's where ${biz} stands today and the highest-impact moves to grow${
          city ? ` in ${city}` : ""
        }.`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / save PDF
            </Button>
            <Link href="/services">
              <Button variant="ghost" size="sm">
                Back to Services
              </Button>
            </Link>
          </div>
        }
      />

      {/* Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where customers find you today</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {channels.map((c) => (
            <div
              key={c.name}
              className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-t border-line py-3 first:border-0"
            >
              <span
                className={cn(
                  "flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px]",
                  c.ok
                    ? "border-teal bg-teal text-white"
                    : "border-plum/40 bg-white"
                )}
              >
                {c.ok ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="font-sans text-sm font-medium text-ink">{c.name}</span>
              <span className="font-sans text-xs text-ink-muted">
                {c.ok ? "Linked" : "Not set up — opportunity"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <SectionLabel>Your priority moves</SectionLabel>
        <div className="mt-4 grid gap-4">
          {recommendations.map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">{r.icon}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-sans text-sm font-semibold text-teal">{r.title}</span>
                      <Pill tone="teal">{r.tag}</Pill>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{r.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade CTA — house onboarding-hero treatment */}
      <Card className="border-teal/25 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(227,242,156,0.55)_0%,rgba(227,242,156,0)_55%),#fff]">
        <CardContent className="pt-7 pb-7">
          <span className="gh-onboard-kicker">Ready when you are</span>
          <h2 className="mt-2 font-serif text-[28px] leading-tight text-teal">
            Want this set up for you{" "}
            <em className="font-serif not-italic text-plum">automatically?</em>
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
            {foundations.name} provisions your Birdeye account and wires up listings,
            messaging and review collection in about 15 minutes — no technical setup.
            From A${foundations.pricePerMonth}/mo, no lock-in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <Link
              href="/plan"
              onClick={() => track("action_plan_upgrade_click", { cta: "get_foundations" })}
            >
              <Button variant="lime" size="lg">
                Get {foundations.name} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/plan"
              onClick={() => track("action_plan_upgrade_click", { cta: "compare_plans" })}
            >
              <Button variant="ghost" size="lg">
                Compare plans
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
