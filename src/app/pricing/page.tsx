'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  PLANS,
  calculateDisplayPrice,
  type BillingInterval,
  type PlanTier,
} from '@/lib/plans';

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loading, setLoading] = useState<PlanTier | null>(null);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const tiers: PlanTier[] = ['foundations', 'growth', 'accelerate'];

  async function startCheckout(tier: PlanTier) {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent('/pricing')}`);
      return;
    }
    setLoading(tier);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Checkout failed');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Something went wrong starting checkout.');
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0ebe0] py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-serif text-[#1a3530] mb-4">
            Pricing
          </h1>
          <p className="text-[#1a3530]/70 max-w-xl mx-auto">
            No lock-in. Cancel any time. Switch tiers as your business grows.
          </p>
        </header>

        {/* Billing interval toggle */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex items-center rounded-full border border-[#1a3530]/20 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setInterval('month')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${
                interval === 'month'
                  ? 'bg-[#1a3530] text-white'
                  : 'text-[#1a3530] hover:bg-[#1a3530]/5'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('year')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                interval === 'year'
                  ? 'bg-[#1a3530] text-white'
                  : 'text-[#1a3530] hover:bg-[#1a3530]/5'
              }`}
            >
              Annual
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  interval === 'year'
                    ? 'bg-[#c5e84a] text-[#1a3530]'
                    : 'bg-[#c5e84a]/40 text-[#1a3530]'
                }`}
              >
                2 months free
              </span>
            </button>
          </div>
        </div>

        {/* Tiers */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tierId) => {
            const tier = PLANS[tierId];
            const { amount, period } = calculateDisplayPrice(tier.monthlyPrice, interval);
            const isHighlight = tier.highlight;
            const billedLabel =
              interval === 'month' ? 'Billed monthly · No lock-in' : 'Billed annually · No lock-in';

            return (
              <div
                key={tierId}
                className={`relative rounded-3xl p-10 flex flex-col ${
                  isHighlight
                    ? 'bg-[#1a3530] text-white shadow-2xl md:scale-[1.03]'
                    : 'bg-white text-[#1a3530] shadow-md'
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#c5e84a] text-[#1a3530] text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">
                    ★ Most popular
                  </div>
                )}

                <div
                  className={`text-xs tracking-[0.2em] uppercase mb-3 font-medium ${
                    isHighlight ? 'text-[#c5e84a]' : 'text-[#7a2929]'
                  }`}
                >
                  {tier.name}
                </div>

                <h3 className="text-3xl font-serif mb-6 leading-tight">{tier.tagline}</h3>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-6xl font-serif tracking-tight">
                    ${amount.toLocaleString()}
                  </span>
                  <span
                    className={`text-sm ml-1 ${
                      isHighlight ? 'text-white/70' : 'text-[#1a3530]/70'
                    }`}
                  >
                    {period}
                  </span>
                </div>

                <div
                  className={`text-xs mb-6 font-medium ${
                    isHighlight ? 'text-[#c5e84a]' : 'text-[#7a2929]'
                  }`}
                >
                  {billedLabel}
                </div>

                <p
                  className={`text-sm mb-6 ${
                    isHighlight ? 'text-white/80' : 'text-[#1a3530]/70'
                  }`}
                >
                  {tier.description}
                </p>

                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm">
                      <span
                        className={`flex-shrink-0 ${
                          isHighlight ? 'text-[#c5e84a]' : 'text-[#7a2929]'
                        }`}
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.addOnNote && (
                  <p
                    className={`text-xs italic mb-6 ${
                      isHighlight ? 'text-white/60' : 'text-[#1a3530]/50'
                    }`}
                  >
                    {tier.addOnNote}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => startCheckout(tierId)}
                  disabled={loading === tierId || !isLoaded}
                  className={`w-full py-4 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isHighlight
                      ? 'bg-[#c5e84a] text-[#1a3530] hover:bg-[#b8db3d]'
                      : 'bg-[#1a3530] text-white hover:bg-[#234741]'
                  }`}
                >
                  {loading === tierId ? 'Loading…' : `Start with ${tier.name} →`}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-[#1a3530]/50 mt-12">
          Add-ons (Search AI, Referrals) can be added after checkout from your billing portal.
        </p>
      </div>
    </div>
  );
}
