import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe } from '@/lib/stripe';
import { getSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sub = await getSubscription(userId);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer for this user — subscribe first' },
      { status: 400 }
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${req.nextUrl.origin}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
