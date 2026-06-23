// In-process ops notifier.
//
// Posts a JSON summary to the reseller ops inbox/webhook so they can activate
// Birdeye modules that aren't enable-able via the public API (Webchat AI,
// module-level entitlements). Falls back to logging when no webhook is set.
//
// Extracted from the /api/notify-ops route so the provisioning orchestrator
// can call it directly (no internal HTTP round-trip, no origin-header
// dependency). The HTTP route is now a thin, authenticated wrapper.

import 'server-only';
import type { z } from 'zod';
import { wizardStateSchema } from '@/lib/wizard/state';
import { PACKAGES } from '@/lib/wizard/packages';

type WizardState = z.infer<typeof wizardStateSchema>;

export async function notifyOps(state: WizardState): Promise<void> {
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    }).catch(() => {
      /* don't fail provisioning over the webhook */
    });
  } else {
    console.log('[notify-ops]', JSON.stringify(summary));
  }
}
