// Posts a JSON summary to the reseller ops inbox/webhook so they can
// activate Birdeye modules that aren't enable-able via the public API
// (Webchat AI, module-level entitlements). Falls back to logging.
//
// Stateless: receives the wizard state in the request body. Bundles every
// field the public Birdeye API doesn't accept (Apple Maps, FAQs,
// contact tags, Webchat styling) so the partner has the full picture.

import { NextResponse } from "next/server";
import { z } from "zod";
import { wizardStateSchema } from "@/lib/wizard/state";
import { PACKAGES } from "@/lib/wizard/packages";

const Body = z.object({ state: wizardStateSchema });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const state = parsed.data.state;
  const pkg = PACKAGES[state.packageId];

  const summary = {
    onboardingId: state.onboardingId,
    package: pkg.name,
    modules: pkg.modules,
    businessNumber: state.provisioning.businessNumber,
    adminEmail: state.adminUser.email,
    additionalUsers: state.additionalUsers.map((u) => u.email),
    captureForPartner: {
      appleDescription: state.descriptions.apple,
      appleCategories: state.taxonomy.appleCategories,
      faqs: state.faqs,
      contactTags: state.contacts
        .filter((c) => c.tags.length > 0)
        .map((c) => ({ email: c.email, phone: c.phone, tags: c.tags })),
    },
    webchat: state.webchat ?? null,
    timestamp: new Date().toISOString(),
  };

  const hook = process.env.OPS_NOTIFY_WEBHOOK;
  if (hook) {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summary),
    }).catch(() => {
      /* don't fail provisioning over the webhook */
    });
  } else {
    console.log("[notify-ops]", JSON.stringify(summary));
  }

  return NextResponse.json({ ok: true });
}
