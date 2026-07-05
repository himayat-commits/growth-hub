// Pure env-coherence checks for the provisioning + billing pipeline. No
// network calls — safe to run at startup (instrumentation) and from the
// ops-gated /api/health/provisioning route.

import "server-only";
import { getProvisionMode } from "@/lib/birdeye/client";

export type HealthCheck = {
  name: string;
  level: "pass" | "warn" | "fail";
  detail: string;
};

const has = (name: string) => Boolean(process.env[name]?.trim());

export function runProvisioningHealthChecks(): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const mode = getProvisionMode();
  const live = mode === "live" || mode === "live_allowlist";

  checks.push({
    name: "provision_mode",
    level: "pass",
    detail: `PROVISION_MODE resolves to "${mode}"`,
  });

  // ── Birdeye credentials ───────────────────────────────────────────────
  if (live && !has("BIRDEYE_API_KEY")) {
    checks.push({
      name: "birdeye_api_key",
      level: "fail",
      detail: `PROVISION_MODE=${mode} but BIRDEYE_API_KEY is empty — every live call will fail`,
    });
  } else {
    checks.push({
      name: "birdeye_api_key",
      level: live ? "pass" : has("BIRDEYE_API_KEY") ? "pass" : "warn",
      detail: has("BIRDEYE_API_KEY")
        ? "BIRDEYE_API_KEY set"
        : "BIRDEYE_API_KEY empty (fine while mode=mock)",
    });
  }

  const resellerId = process.env.BIRDEYE_RESELLER_ID?.trim();
  if (live && (!resellerId || resellerId === "demo-reseller")) {
    checks.push({
      name: "birdeye_reseller_id",
      level: "fail",
      detail: `PROVISION_MODE=${mode} but BIRDEYE_RESELLER_ID is ${resellerId ? "the demo fallback" : "unset"}`,
    });
  } else {
    checks.push({
      name: "birdeye_reseller_id",
      level: "pass",
      detail: resellerId ? "BIRDEYE_RESELLER_ID set" : "using demo fallback (mock mode)",
    });
  }

  checks.push({
    name: "birdeye_api_host",
    level: has("BIRDEYE_API_HOST") ? "pass" : "warn",
    detail: has("BIRDEYE_API_HOST")
      ? "BIRDEYE_API_HOST set"
      : "BIRDEYE_API_HOST unset — default https://api.birdeye.com/resources in play",
  });
  checks.push({
    name: "birdeye_dashboard_url",
    level: has("BIRDEYE_DASHBOARD_URL_TEMPLATE") ? "pass" : "warn",
    detail: has("BIRDEYE_DASHBOARD_URL_TEMPLATE")
      ? "dashboard deep-link template set"
      : "BIRDEYE_DASHBOARD_URL_TEMPLATE unset — done-page links go to the generic login",
  });
  if (has("NEXT_PUBLIC_PROVISION_MODE")) {
    checks.push({
      name: "legacy_public_mode",
      level: "warn",
      detail:
        "NEXT_PUBLIC_PROVISION_MODE is still set — transitional fallback; move to PROVISION_MODE and remove it",
    });
  }

  // ── Stripe price IDs ──────────────────────────────────────────────────
  const priceVars = [
    "STRIPE_PRICE_FOUNDATIONS_MONTHLY",
    "STRIPE_PRICE_FOUNDATIONS_YEARLY",
    "STRIPE_PRICE_GROWTH_MONTHLY",
    "STRIPE_PRICE_GROWTH_YEARLY",
    "STRIPE_PRICE_ACCELERATE_MONTHLY",
    "STRIPE_PRICE_ACCELERATE_YEARLY",
  ];
  const missingPrices = priceVars.filter((v) => !has(v));
  checks.push({
    name: "stripe_prices",
    level: missingPrices.length ? "fail" : "pass",
    detail: missingPrices.length
      ? `missing: ${missingPrices.join(", ")} — checkout for those plans 500s`
      : "all six plan price IDs set",
  });
  const missingAddOns = ["STRIPE_PRICE_SEARCH_AI_MONTHLY", "STRIPE_PRICE_REFERRALS_MONTHLY"].filter(
    (v) => !has(v),
  );
  if (missingAddOns.length) {
    checks.push({
      name: "stripe_addon_prices",
      level: "warn",
      detail: `missing add-on prices: ${missingAddOns.join(", ")}`,
    });
  }

  // ── Ops handoff channels ──────────────────────────────────────────────
  if (!has("RESEND_API_KEY") && !has("OPS_NOTIFY_WEBHOOK")) {
    checks.push({
      name: "ops_channels",
      level: "warn",
      detail:
        "neither RESEND_API_KEY nor OPS_NOTIFY_WEBHOOK set — provisioning handoff falls back to console logs",
    });
  } else {
    checks.push({ name: "ops_channels", level: "pass", detail: "ops handoff channel configured" });
  }
  if (process.env.VERCEL_ENV === "production" && !has("OPS_EMAILS")) {
    checks.push({
      name: "ops_emails",
      level: "warn",
      detail: "OPS_EMAILS unset in production — fallback allowlist (waheed@himayat.com.au) active",
    });
  }
  if (process.env.VERCEL && !has("CRON_SECRET")) {
    checks.push({
      name: "cron_secret",
      level: "warn",
      detail: "CRON_SECRET unset — the provisioning retry cron will reject every invocation",
    });
  }

  return checks;
}
