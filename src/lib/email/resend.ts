// Lazy Resend singleton — same shape as getStripe(). Returns null when
// RESEND_API_KEY is unset so callers can no-op in dev/preview without
// sprinkling env checks everywhere.

import 'server-only';
import { Resend } from 'resend';

let _resend: Resend | null | undefined;

export function getResend(): Resend | null {
  if (_resend === undefined) {
    _resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }
  return _resend;
}

export const DEFAULT_FROM = 'Growth Hub <noreply@himayat.com.au>';
export const OPS_EMAIL = process.env.OPS_NOTIFICATION_EMAIL ?? 'hello@himayat.com.au';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
