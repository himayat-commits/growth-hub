// Resolves the URL that "Open my Birdeye dashboard" buttons should point at.
//
// We don't hard-code the deep-link format because Birdeye's customer-facing
// URL has shifted before (app.birdeye.com → cloud.birdeye.com etc.) and the
// exact business-deep-link pattern varies by reseller. Instead we accept a
// template via env var with a `{businessNumber}` placeholder.
//
// Env (Vercel Production + Preview):
//   BIRDEYE_DASHBOARD_URL_TEMPLATE
//     Defaults to "https://app.birdeye.com" (generic login).
//     Set to e.g. "https://app.birdeye.com/businesses/{businessNumber}/dashboard"
//     once Birdeye confirms the canonical deep-link path.

const DEFAULT_TEMPLATE = "https://app.birdeye.com";

export function getBirdeyeDashboardUrl(businessNumber?: string | null): string {
  const template = process.env.BIRDEYE_DASHBOARD_URL_TEMPLATE ?? DEFAULT_TEMPLATE;
  if (!businessNumber) return template.replace(/\{businessNumber\}/g, "");
  return template.replace(/\{businessNumber\}/g, encodeURIComponent(businessNumber));
}
