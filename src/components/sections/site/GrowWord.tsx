// The hand-drawn lime underline under "grow." — the brand's signature, used by
// the home hero. Sits inside .hero-h1, whose .grow rule positions it.

export default function GrowWord({ word = 'grow' }: { word?: string }) {
  return (
    <span className="grow">
      {word}
      <svg
        viewBox="0 0 320 22"
        width="100%"
        aria-hidden="true"
        fill="none"
        stroke="#E3F29C"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ position: 'absolute', left: 0, bottom: '-10px', width: '100%' }}
      >
        <path d="M6 14 C 60 6, 120 4, 180 8 C 230 11, 280 9, 314 13" />
        <path d="M12 18 C 80 15, 160 13, 300 17" opacity="0.5" />
      </svg>
    </span>
  );
}
