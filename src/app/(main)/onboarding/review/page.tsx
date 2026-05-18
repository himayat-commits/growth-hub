"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWizard } from "@/components/wizard/WizardContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pill,
  SectionLabel,
} from "@/components/ui/card";
import { PayloadPreview } from "@/components/wizard/PayloadPreview";
import { Logo } from "@/components/brand/Logo";
import { ChevronRight, Rocket, ShieldCheck } from "lucide-react";
import { assembleAllPayloads, REQUEST_LABELS } from "@/lib/birdeye/payloads";
import { PACKAGES } from "@/lib/wizard/packages";

const PUBLIC_HOST = "https://api.birdeye.com/resources";
const PREVIEW_RESELLER_ID = "{resellerId}";

type ProvisionEvent = {
  step: number;
  total: number;
  kind: string;
  label: string;
  status: "running" | "ok" | "error";
  response?: unknown;
  error?: string;
};

type DoneEvent = {
  type: "done";
  businessNumber: string;
  invitedUsers: string[];
  mediaIds: string[];
};

export default function ReviewPage() {
  const { state, patch } = useWizard();
  const router = useRouter();
  const [provisioning, setProvisioning] = React.useState(false);
  const [events, setEvents] = React.useState<ProvisionEvent[]>([]);

  const requests = React.useMemo(
    () => assembleAllPayloads(state, PREVIEW_RESELLER_ID, PUBLIC_HOST),
    [state]
  );
  const pkg = PACKAGES[state.packageId];

  const provision = async () => {
    setProvisioning(true);
    setEvents([]);
    // Stateless API on Vercel — send the full wizard state in the body.
    const res = await fetch("/api/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    if (!res.body) {
      setProvisioning(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const p of parts) {
        const line = p.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim()) as ProvisionEvent | DoneEvent;
          if ("type" in ev && ev.type === "done") {
            // Persist provisioning result back to localStorage so /portal
            // and /done can render the businessNumber and invitations.
            patch((s) => ({
              ...s,
              status: "provisioned",
              provisioning: {
                businessNumber: ev.businessNumber,
                invitedUsers: ev.invitedUsers,
                mediaIds: ev.mediaIds,
                completedAt: new Date().toISOString(),
              },
            }));
            setProvisioning(false);
            router.push("/onboarding/done");
            return;
          }
          setEvents((curr) => [...curr, ev as ProvisionEvent]);
        } catch {
          /* malformed line — ignore */
        }
      }
    }
    setProvisioning(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="flex items-center justify-between">
        <Logo />
        <Pill tone="teal">{pkg.name}</Pill>
      </div>

      <SectionLabel className="mt-12">Step 12 — final check</SectionLabel>
      <h1 className="font-serif text-section text-teal mt-4 leading-[1.05]">
        Review &amp;{" "}
        <em className="not-italic text-plum font-serif">launch.</em>
      </h1>
      <p className="mt-5 text-ink-muted max-w-2xl leading-relaxed text-lg">
        Everything we collected is below, grouped by section. Click any row to
        jump back and edit. Below that, the exact Birdeye API calls
        we&apos;ll make on your behalf — so you know precisely what&apos;s
        about to happen.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-teal" />
            Captured information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1">
          <SummaryRow href="/onboarding/confirm" label="Admin user">
            {state.adminUser.firstName} {state.adminUser.lastName} ·{" "}
            {state.adminUser.email}
            {state.additionalUsers.length
              ? ` · +${state.additionalUsers.length} team members`
              : ""}
          </SummaryRow>
          <SummaryRow href="/onboarding/business" label="Business identity">
            {state.business.name || "—"} · {state.business.timezone}
            {state.business.abn ? ` · ABN ${state.business.abn}` : ""}
          </SummaryRow>
          <SummaryRow href="/onboarding/address" label="Address & contact">
            {[
              state.address.address1,
              state.address.city,
              state.address.state,
              state.address.zip,
            ]
              .filter(Boolean)
              .join(", ") || "—"}{" "}
            · {state.address.phone}
          </SummaryRow>
          <SummaryRow href="/onboarding/hours" label="Hours">
            {state.hours.is24x7
              ? "Open 24/7"
              : `${state.hours.weekly.filter((d) => d.isOpen).length} days/week open`}{" "}
            · {state.hours.status}
          </SummaryRow>
          <SummaryRow href="/onboarding/about" label="About & descriptions">
            Birdeye {state.descriptions.birdeye.length}/5000 · Google{" "}
            {state.descriptions.google.length}/750 · FB{" "}
            {state.descriptions.facebook.length}/255
          </SummaryRow>
          <SummaryRow href="/onboarding/taxonomy" label="Categories & keywords">
            Primary: {state.taxonomy.gmbPrimary || "—"}
            {state.taxonomy.payment.length
              ? ` · ${state.taxonomy.payment.length} payment methods`
              : ""}
          </SummaryRow>
          <SummaryRow href="/onboarding/assets" label="Brand assets">
            {state.assets.logoUrl ? "Logo ✓ " : "Logo missing "}
            {state.assets.birdeyeCoverUrl ? "· Cover ✓ " : "· Cover missing "}·{" "}
            {state.assets.showcase.length} showcase
          </SummaryRow>
          <SummaryRow href="/onboarding/social" label="Social profiles">
            {Object.values(state.social).filter(Boolean).length} linked
          </SummaryRow>
          <SummaryRow href="/onboarding/faqs" label="Custom FAQs">
            {state.faqs.length}
          </SummaryRow>
          {state.packageId === "accelerate" ? (
            <SummaryRow href="/onboarding/webchat" label="Webchat">
              Agent: {state.webchat?.agentName} · Window:{" "}
              {state.webchat?.windowSize}
            </SummaryRow>
          ) : null}
          <SummaryRow href="/onboarding/contacts" label="Initial contacts">
            {state.contacts.length} contacts
          </SummaryRow>
        </CardContent>
      </Card>

      <h2 className="mt-14 font-serif text-3xl text-teal flex items-center gap-2.5">
        <Rocket className="h-6 w-6 text-plum" />
        What will be sent to Birdeye
      </h2>
      <p className="mt-2 text-ink-muted leading-relaxed max-w-2xl">
        {requests.length} API calls in sequence. The first one returns your{" "}
        <code className="font-sans text-xs bg-eggshell-warm px-1.5 py-0.5 rounded text-teal">
          businessNumber
        </code>
        ; we splice that into every call after it. Your{" "}
        <code className="font-sans text-xs bg-eggshell-warm px-1.5 py-0.5 rounded text-teal">
          x-api-key
        </code>{" "}
        stays on the server.
      </p>

      <div className="mt-5 grid gap-2.5">
        {requests.map((r, i) => (
          <PayloadPreview
            key={i}
            index={i + 1}
            label={REQUEST_LABELS[r.kind]}
            method={r.req.method}
            url={r.req.url}
            headers={"headers" in r.req ? r.req.headers : undefined}
            body={r.req.body}
          />
        ))}
      </div>

      <div className="mt-12 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/onboarding/contacts">
          <Button variant="ghost">← Back</Button>
        </Link>
        <Button size="lg" variant="lime" onClick={provision} disabled={provisioning}>
          {provisioning ? "Provisioning…" : "Provision my Birdeye account"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {events.length ? (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-base">Provisioning progress</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            {events.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 text-sm font-sans border-b border-line pb-2.5 last:border-0 last:pb-0"
              >
                <span>
                  {e.step}/{e.total} · {e.label}
                </span>
                {e.status === "ok" ? (
                  <Pill tone="lime">✓ ok</Pill>
                ) : e.status === "error" ? (
                  <Pill tone="red">error</Pill>
                ) : (
                  <Pill tone="amber">running…</Pill>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function SummaryRow({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-eggshell-warm/50 transition-colors"
    >
      <span className="font-sans text-[11px] font-semibold text-ink-muted uppercase tracking-wider w-44 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-ink flex-1 truncate">{children}</span>
      <ChevronRight className="h-4 w-4 text-ink-muted/50" />
    </Link>
  );
}
