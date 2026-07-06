import * as React from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent, Pill } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// The Birdeye lifecycle banner on /services. One card, six states, all in
// the house language (Card + Pill + Button) — replaces the old
// .portal-birdeye-* markup whose styles lived in the marketing stylesheet
// and never loaded on the app surface.
export type BirdeyeBannerState =
  | { kind: "ready"; businessName: string | null; businessNumber: string; dashboardUrl: string }
  | { kind: "running" }
  | { kind: "escalated"; businessName: string | null; failedCount: number }
  | {
      kind: "partial";
      businessName: string | null;
      businessNumber: string;
      failedCount: number;
    }
  | {
      kind: "setup";
      phase: "failed" | "resume" | "start";
      done: number;
      total: number;
      setupHref: string;
    }
  | { kind: "free"; reportComplete: boolean };

export function BirdeyeStatusBanner({ state }: { state: BirdeyeBannerState }) {
  const ready = state.kind === "ready";
  return (
    <Card
      className={
        ready
          ? "border-teal/25 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(227,242,156,0.55)_0%,rgba(227,242,156,0)_55%),#fff]"
          : undefined
      }
    >
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 pb-6 md:pt-7 md:pb-7">
        <div className="min-w-0 flex-1 basis-72">
          <BannerPill state={state} />
          <h2 className="mt-2.5 font-serif text-[22px] leading-tight tracking-tight text-teal">
            <BannerTitle state={state} />
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            <BannerSub state={state} />
          </p>
        </div>
        <div className="flex-shrink-0">
          <BannerCta state={state} />
        </div>
      </CardContent>
    </Card>
  );
}

function BannerPill({ state }: { state: BirdeyeBannerState }) {
  switch (state.kind) {
    case "ready":
      return <Pill tone="lime">Birdeye account ready</Pill>;
    case "running":
      return (
        <Pill tone="teal">
          <Spinner className="h-3 w-3" /> Setup in progress
        </Pill>
      );
    case "escalated":
      return <Pill tone="teal">We&apos;re on it</Pill>;
    case "partial":
      return <Pill tone="red">Setup needs attention</Pill>;
    case "setup":
      return (
        <Pill tone={state.phase === "failed" ? "red" : "teal"}>
          {state.phase === "failed"
            ? "Setup didn't finish"
            : state.phase === "resume"
              ? "Setup in progress"
              : "Setup pending"}
        </Pill>
      );
    case "free":
      return <Pill tone="lime">Free action plan</Pill>;
  }
}

function BannerTitle({ state }: { state: BirdeyeBannerState }) {
  switch (state.kind) {
    case "ready":
      return state.businessName
        ? `${state.businessName} is live on Birdeye.`
        : "Your Birdeye account is ready.";
    case "running":
      return "Setting up your account now…";
    case "escalated":
      return state.businessName
        ? `${state.businessName} is live — our team is finishing setup.`
        : "Your account is live — our team is finishing setup.";
    case "partial":
      return state.businessName
        ? `${state.businessName} is live, but setup didn't fully finish.`
        : "Your Birdeye account needs attention.";
    case "setup":
      return state.phase === "failed"
        ? "Let's finish setting up your Birdeye account."
        : state.phase === "resume"
          ? "Pick up where you left off."
          : "Set up your Birdeye account.";
    case "free":
      return state.reportComplete
        ? "Your Birdeye action plan is ready."
        : "Get your free Birdeye action plan.";
  }
}

function BannerSub({ state }: { state: BirdeyeBannerState }) {
  switch (state.kind) {
    case "ready":
      return (
        <>
          Business number{" "}
          <code className="rounded bg-eggshell-warm px-1.5 py-0.5 font-sans text-xs text-teal">
            {state.businessNumber}
          </code>
        </>
      );
    case "running":
      return <>We&apos;re creating your Birdeye account — this takes about a minute.</>;
    case "escalated":
      return (
        <>
          Your account is live; our team is completing the last {state.failedCount} setup step
          {state.failedCount === 1 ? "" : "s"}. We&apos;ll notify you when it&apos;s done.
        </>
      );
    case "partial":
      return (
        <>
          Business number{" "}
          <code className="rounded bg-eggshell-warm px-1.5 py-0.5 font-sans text-xs text-teal">
            {state.businessNumber}
          </code>{" "}
          · {state.failedCount} step{state.failedCount === 1 ? "" : "s"} need a retry.
        </>
      );
    case "setup":
      return state.phase === "failed" ? (
        <>Your last attempt didn&apos;t complete — your answers are saved. Pick up and retry.</>
      ) : state.phase === "resume" ? (
        <>
          {state.done} of {state.total} steps complete · we&apos;ll resume right where you left
          off.
        </>
      ) : (
        <>15-minute wizard. Save and resume any time — we&apos;ll pick up right where you left off.</>
      );
    case "free":
      return state.reportComplete ? (
        <>
          A personalised local-growth plan built from your answers — plus what Foundations
          automates for you.
        </>
      ) : (
        <>
          Answer a few questions about your business and we&apos;ll build a personalised
          local-growth plan — free, no card needed.
        </>
      );
  }
}

function BannerCta({ state }: { state: BirdeyeBannerState }) {
  switch (state.kind) {
    case "ready":
      return (
        <a href={state.dashboardUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="lime">
            Open your Birdeye dashboard <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      );
    case "running":
      return (
        <Link href="/onboarding/review">
          <Button>
            See live progress <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    case "escalated":
      return (
        <a href="mailto:hello@himayat.com.au?subject=Birdeye%20setup">
          <Button variant="outline">Questions? Email us</Button>
        </a>
      );
    case "partial":
      return (
        <Link href="/onboarding/review">
          <Button>
            Resume / retry <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    case "setup":
      return (
        <Link href={state.setupHref}>
          <Button>
            {state.phase === "failed"
              ? "Retry setup"
              : state.phase === "resume"
                ? "Resume setup"
                : "Start setup"}{" "}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    case "free":
      return (
        <Link href={state.reportComplete ? "/onboarding/action-plan" : "/onboarding"}>
          <Button>
            {state.reportComplete ? "View your action plan" : "Build your action plan"}{" "}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      );
  }
}
