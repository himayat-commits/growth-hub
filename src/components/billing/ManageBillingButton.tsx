'use client';

import { useState } from 'react';

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Could not open billing portal');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className="px-6 py-3 bg-[#1a3530] text-white rounded-full text-sm font-medium hover:bg-[#234741] transition disabled:opacity-50"
    >
      {loading ? 'Opening…' : 'Manage billing'}
    </button>
  );
}
