// Per-guide OG card: the topic as the kicker and the guide title as the
// headline. Every guide is known at build time, so these are static.

import { ImageResponse } from 'next/og';
import { getGuide } from '@/lib/guides';
import { GuideOgCard } from '../og-card';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'A free guide from Growth Hub';

type Params = Promise<{ slug: string }>;

/** Splits a title into two balanced lines at a word break. */
function twoLines(title: string): string[] {
  const words = title.split(' ');
  if (words.length < 3) return [title];
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length;
    const b = words.slice(i).join(' ').length;
    const bestA = words.slice(0, best).join(' ').length;
    const bestB = words.slice(best).join(' ').length;
    if (Math.abs(a - b) < Math.abs(bestA - bestB)) best = i;
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

export default async function GuideOgImage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  return new ImageResponse(
    <GuideOgCard
      kicker={guide ? `Free guide · ${guide.area}` : 'Free guide'}
      lines={twoLines(guide?.title ?? 'Free guides from Growth Hub')}
      foot={`thegrowthhub.com.au/guides${guide ? `/${guide.slug}` : ''}`}
    />,
    size,
  );
}
