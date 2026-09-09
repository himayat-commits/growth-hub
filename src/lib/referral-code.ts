// Shared shape of a member referral code. Imported by the proxy (cookie
// validation), the auth callback (re-validation at consumption) and the
// profile bootstrap (generation). Keep dependency-free: src/proxy.ts runs in
// the middleware runtime and must not pull in Drizzle.

/** GROW-{SLUG}-{YYYY}-{4 random chars}. Upper-case alphanumerics + dashes. */
export const REF_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/i;

export function isValidReferCode(code: string | null | undefined): code is string {
  return typeof code === 'string' && REF_CODE_PATTERN.test(code);
}
