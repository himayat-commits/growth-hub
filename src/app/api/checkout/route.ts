import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import {
  ADDONS,
  getAddOnPriceId,
  getPlanPriceId,
  type AddOnId,
  type BillingInterval,
  type PlanTier,
} from '@/lib/plans';

export const runtime = 'nodejs';

interface CheckoutRequest {
  tier: PlanTier;
  interval: BillingInterval;
  addOns?: AddOnId[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: 'No primary email on Clerk user' }, { status: 400 });
  }

  let body: CheckoutRequest;
  try {
    body = (await req.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tier, interval, addOns = [] } = body;
  if (!tier || !interval) {
    return NextResponse.json({ error: 'tier and interval are required' }, { status: 400 });
  }

  // Build line items: base plan + valid add-ons.
  // Add-ons are silently filtered to those compatible with the chosen tier.
  let planPriceId: string;
  try {
    planPriceId = getPlanPriceId(tier, interval);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const lineItems: Array<{ price: string; quantity: number }> = [
    { price: planPriceId, quantity: 1 },
  ];

  for (const addOnId of addOns) {
    const addOnConfig = ADDONS[addOnId];
    if (!addOnConfig) continue;
    if (!addOnConfig.availableFor.includes(tier)) continue;
    try {
      lineItems.push({ price: getAddOnPriceId(addOnId), quantity: 1 });
    } catch {
      // Missing env var — skip rather than fail the whole checkout
    }
  }

  // Reuse an existing Stripe customer for this user, or create one.
  const existing = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  let customerId = existing[0]?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;

    if (existing.length > 0) {
      await getDb()
        .update(subscriptions)
        .set({ stripeCustomerId: customerId, email, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId));
    } else {
      await getDb().insert(subscriptions).values({
        userId,
        email,
        stripeCustomerId: customerId,
      });
    }
  }

  const origin = req.nextUrl.origin;

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: lineItems,
    success_url: `${origin}/onboarding?checkout=success`,
    cancel_url: `${origin}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    subscription_data: {
      metadata: {
        clerkUserId: userId,
        planTier: tier,
        billingInterval: interval,
      },
    },
    metadata: {
      clerkUserId: userId,
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
