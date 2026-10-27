// The lime mark under "grow." — the brand's signature, used by the home hero.
// Drawn as a thick highlighter stroke behind the word rather than a hairline:
// a thin lime line all but disappears on eggshell (about 1.05:1 contrast),
// while a broad stroke still reads as lime. Sits inside .hero-h1.

export default function GrowWord({ word = 'grow' }: { word?: string }) {
  return (
    <span className="grow" style={{ position: 'relative', zIndex: 0 }}>
      {word}
      <svg
        viewBox="0 0 320 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        fill="none"
        stroke="#E3F29C"
        strokeLinecap="round"
        style={{ position: 'absolute', left: '-4%', width: '108%', bottom: '0.02em', height: '0.46em', zIndex: -1 }}
      >
        <path d="M10 25 C 70 14, 150 11, 214 17 C 258 21, 290 19, 310 15" strokeWidth="24" />
      </svg>
    </span>
  );
}
