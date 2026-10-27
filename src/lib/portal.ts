// Member portal switch — stage 0 of the portal wind-down (parked 26 Oct 2026).
//
// While parked, my.thegrowthhub.com.au takes on no new commitments: /sign-up
// goes to the Sessions calendar, first sign-ins skip the referral, welcome and
// HubSpot side effects, the ?ref= cookie isn't set, and subscription checkout,
// plan changes, service bookings and portal RSVPs return 410. Existing members
// can still sign in, open /plan and the billing portal; the Stripe webhook,
// /ops, /orders, the shop and Payload /admin are unaffected.
//
// Server-only: read from the runtime environment (not NEXT_PUBLIC_), so import
// it from route handlers, server components and the proxy, never a client
// component. Parked unless PORTAL_PARKED is exactly "false". To reopen, set
// PORTAL_PARKED=false in Vercel and redeploy (env changes only reach new
// deployments).

import { NextResponse } from 'next/server';
import { CONTACT } from '@/lib/site';

export const PORTAL_PARKED = process.env.PORTAL_PARKED !== 'false';

/** 410 for portal actions that would start a new commitment while parked.
 *  `error` is what the portal's client components already show on failure. */
export function portalParkedResponse() {
  return NextResponse.json(
    {
      error: `The member portal is paused, so this isn't available right now. Email ${CONTACT.email} if you need a hand.`,
      code: 'portal_parked',
    },
    { status: 410 },
  );
}
