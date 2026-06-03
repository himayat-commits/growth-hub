"use client";

import Script from "next/script";
import { useRef } from "react";

// HubSpot v2 embed loader for the expo application form. Mirrors the
// inert-when-blank pattern in src/components/analytics/Pixels.tsx: when the
// portal / form IDs aren't configured (dev, preview, pre-launch) the page
// renders a mailto fallback instead of an empty container.
//
// IDs come from HubSpot → Marketing → Forms → Share → Embed code. Set them in
// .env.local (local) and the Vercel project env (prod / preview). Because
// NEXT_PUBLIC_* is inlined at build time, a redeploy is needed after changing
// them in Vercel; locally, restart `next dev`.

const PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
const FORM_ID = process.env.NEXT_PUBLIC_HUBSPOT_EXPO_FORM_ID;
const REGION = process.env.NEXT_PUBLIC_HUBSPOT_REGION || "na1";

declare global {
  interface Window {
    hbspt?: {
      forms: { create: (opts: Record<string, unknown>) => void };
    };
  }
}

export default function HubSpotForm() {
  // Guard against double-creation: onLoad fires on first script load, onReady
  // fires again on remount when the script is already cached (SPA navigation).
  const created = useRef(false);

  if (!PORTAL_ID || !FORM_ID) {
    return (
      <p className="cf2-fine" style={{ fontStyle: "normal" }}>
        Applications open soon — email{" "}
        <a
          href="mailto:hello@himayat.com.au?subject=Involvement%20%E2%80%94%20Entrepreneurship%20for%20Everyone%209%20July"
          style={{ textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          hello@himayat.com.au
        </a>{" "}
        to register your interest as a stallholder, workshop facilitator or
        speaker.
      </p>
    );
  }

  const buildForm = () => {
    if (created.current || !window.hbspt) return;
    created.current = true;
    window.hbspt.forms.create({
      region: REGION,
      portalId: PORTAL_ID,
      formId: FORM_ID,
      target: "#hs-expo-form",
    });
  };

  return (
    <>
      <div id="hs-expo-form" className="hs-embed" />
      <Script
        id="hs-forms-v2"
        src="https://js.hsforms.net/forms/embed/v2.js"
        strategy="afterInteractive"
        onLoad={buildForm}
        onReady={buildForm}
      />
    </>
  );
}
