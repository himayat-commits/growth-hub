// Contact details and outbound links shared by the marketing pages, the
// navbar and the footer. Change them here once.

export const CONTACT = {
  email: 'hello@thegrowthhub.com.au',
  phone: '02 5119 0005',
  phoneHref: 'tel:0251190005',
  address: 'Level 4, 1 Moore St, Canberra ACT 2601',
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

/** CBR Innovation Network's Digital Solutions program (free one-on-one advice). */
export const CBRIN_DIGITAL_SOLUTIONS_URL = 'https://cbrin.com.au';
