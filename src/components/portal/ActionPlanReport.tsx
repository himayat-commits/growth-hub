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
import { Logo } from "@/components/brand/Logo";
import { PACKAGES } from "@/lib/wizard/packages";
import {
  ArrowRight,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  Printer,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";

export function ActionPlanReport() {
  const { state } = useWizard();

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
    <main className="min-h-screen">
      <header className="bg-eggshell/85 border-b border-teal/10 backdrop-blur-md print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <Pill tone="lime">Free action plan</Pill>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <SectionLabel>Your local growth plan</SectionLabel>
        <h1 className="font-serif text-section text-teal mt-4 leading-[1.05]">
          {biz}&apos;s{" "}
          <em className="not-italic text-plum font-serif">action plan.</em>
        </h1>
        <p className="mt-5 text-ink-muted max-w-2xl text-lg leading-relaxed">
          Built from your answers — here&apos;s where {biz} stands today and the
          highest-impact moves to grow{city ? ` in ${city}` : ""}. Foundations can
          set most of this up for you automatically.
        </p>

        <div className="mt-7 flex flex-wrap gap-3 print:hidden">
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print / save as PDF
          </Button>
          <Link href="/services">
            <Button variant="ghost" size="lg">
              Back to Services
            </Button>
          </Link>
        </div>

        {/* Snapshot */}
        <Card className="mt-9">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Where customers find you today</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {channels.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-teal flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-plum/70 flex-shrink-0" />
                )}
                <span className="font-sans text-sm text-teal">{c.name}</span>
                <span className="font-sans text-xs text-ink-muted ml-auto">
                  {c.ok ? "Linked" : "Not set up — opportunity"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <h2 className="mt-12 font-serif text-3xl text-teal flex items-center gap-2.5">
          <Sparkles className="h-6 w-6 text-plum" />
          Your priority moves
        </h2>
        <div className="mt-5 grid gap-4">
          {recommendations.map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">{r.icon}</span>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-sans text-sm font-semibold text-teal">{r.title}</span>
                      <Pill tone="teal">{r.tag}</Pill>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{r.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upgrade CTA */}
        <Card className="mt-12 border-teal/20 bg-lime/20">
          <CardContent className="pt-7 pb-7">
            <SectionLabel>Stop reading, start growing</SectionLabel>
            <h2 className="mt-3 font-serif text-3xl text-teal leading-tight">
              Want this set up for you{" "}
              <em className="not-italic text-plum font-serif">automatically?</em>
            </h2>
            <p className="mt-3 text-ink-muted leading-relaxed max-w-2xl">
              {foundations.name} provisions your Birdeye account and wires up listings,
              messaging and review collection in about 15 minutes — no technical setup.
              From A${foundations.pricePerMonth}/mo, no lock-in.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 print:hidden">
              <Link href="/plan">
                <Button variant="lime" size="lg">
                  Get {foundations.name} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/plan">
                <Button variant="ghost" size="lg">
                  Compare plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
