// Guides hub OG card. Static at deploy time.

import { ImageResponse } from 'next/og';
import { GuideOgCard } from './og-card';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Free guides from Growth Hub — one practical topic, one checklist.';

export default function GuidesOgImage() {
  return new ImageResponse(
    <GuideOgCard kicker="Free guides" lines={['One practical topic.', 'One checklist.']} foot="thegrowthhub.com.au/guides" />,
    size,
  );
}
