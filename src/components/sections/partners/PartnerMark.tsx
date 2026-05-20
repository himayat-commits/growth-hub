// Abstract mono partner glyph used in the FeaturedWall and PartnerDirectory.
// Renders as a small SVG inside the .fw-mark / .p-card-mark tile — no
// dependency on real partner logo uploads.

import type { PartnerShape } from './shared';

const SHAPE_PATHS: Record<PartnerShape, React.ReactNode> = {
  leaf: <path d="M4 22 C 4 12, 12 4, 22 4 L 22 22 Z" />,
  arc: <path d="M4 22 A 18 18 0 0 1 22 4" />,
  diamond: <path d="M13 3 L 23 13 L 13 23 L 3 13 Z" />,
  circle: <circle cx="13" cy="13" r="9" />,
  triangle: <path d="M13 4 L 22 22 L 4 22 Z" />,
  bars: (
    <g>
      <rect x="4" y="6" width="3" height="14" />
      <rect x="10" y="10" width="3" height="10" />
      <rect x="16" y="4" width="3" height="16" />
    </g>
  ),
  cross: (
    <g>
      <path d="M5 13 H 21" />
      <path d="M13 5 V 21" />
    </g>
  ),
  hex: <path d="M13 3 L 22 8 L 22 18 L 13 23 L 4 18 L 4 8 Z" />,
};

export default function PartnerMark({
  shape = 'circle',
  size = 26,
}: {
  shape?: PartnerShape;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 26 26"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SHAPE_PATHS[shape] ?? SHAPE_PATHS.circle}
    </svg>
  );
}
