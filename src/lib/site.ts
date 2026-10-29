// Contact details and outbound links shared by the marketing pages, the
// navbar and the footer. Change them here once.

export const CONTACT = {
  email: 'hello@thegrowthhub.com.au',
  phone: '02 5119 0005',
  phoneHref: 'tel:0251190005',
  address: 'Level 4, 1 Moore St, Canberra ACT 2601',
};

/** Free Build Lab seats for hardship and partner referrals: the explainer page,
 *  and the contact form with "A free Build Lab seat" already ticked. */
export const FREE_SEATS = {
  path: '/free-seats',
  ask: '/about?ask=free-seat#contact',
};

/** Growth Hub Sites runs on the white-label platform at app.thegrowthhub.com.au.
 *  Plan ids come from the platform's plan list (Storefront monthly / annual). */
const SITES_APP = 'https://app.thegrowthhub.com.au';

export const SITES = {
  signIn: SITES_APP,
  trialMonthly: `${SITES_APP}/user/register?plan=3534`,
  trialAnnual: `${SITES_APP}/user/register?plan=3535`,
};

/** Self-serve trials stay closed until customer sites on *.sites.thegrowthhub.com.au
 *  get a valid certificate (they currently present the platform's m1.a5k.it
 *  certificate, so a published site opens with a browser warning). Flip to
 *  true and the trial buttons on /sites come back. */
export const SITES_TRIALS_OPEN = false;

/** Eventbrite booking links get a tracking code (`aff`), so Eventbrite's order
 *  reports show which bookings came from this site rather than from its own
 *  listings. Other links pass through unchanged. */
export function bookingHref(url: string): string {
  try {
    const u = new URL(url);
    if (!/(^|\.)eventbrite\.com(\.au)?$/.test(u.hostname) || u.searchParams.has('aff')) return url;
    u.searchParams.set('aff', 'thegrowthhub');
    return u.toString();
  } catch {
    return url;
  }
}

/** CBR Innovation Network's Digital Solutions program (free one-on-one advice). */
export const CBRIN_DIGITAL_SOLUTIONS_URL = 'https://cbrin.com.au';
