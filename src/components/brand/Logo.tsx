import { cn } from "@/lib/cn";

// Real Himayat butterfly logomark. The PNG ships as a teal silhouette;
// for non-teal needs we apply a CSS filter chain mapped to each tint
// (matches the brand site's <Butterfly> component).

type Variant = "dark" | "light";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { dim: number; word: string; sub: string }> = {
  sm: { dim: 24, word: "text-[17px]", sub: "text-[13px]" },
  md: { dim: 30, word: "text-xl", sub: "text-[15px]" },
  lg: { dim: 38, word: "text-2xl", sub: "text-[17px]" },
};

const FILTERS: Record<Variant, { mark: string; word: string; sub: string }> = {
  dark: {
    // Teal silhouette as-is, plum for the "by Himayat" sub.
    mark: "none",
    word: "text-teal",
    sub: "text-plum",
  },
  light: {
    // Filter chain that maps black→white→lime tint, matching brand site.
    mark: "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(10deg) brightness(1.08)",
    word: "text-eggshell",
    sub: "text-lime",
  },
};

export function Logo({
  className,
  variant = "dark",
  showSub = true,
  size = "md",
}: {
  className?: string;
  variant?: Variant;
  showSub?: boolean;
  size?: Size;
}) {
  const { dim, word, sub } = SIZES[size];
  const f = FILTERS[variant];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/himayat-logo.png"
        alt=""
        width={dim}
        height={dim}
        aria-hidden="true"
        style={{
          width: dim,
          height: dim,
          objectFit: "contain",
          filter: f.mark,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif tracking-tight", word, f.word)}>
          Growth Hub
        </span>
        {showSub ? (
          <span className={cn("font-serif italic mt-1", sub, f.sub)}>
            by Himayat
          </span>
        ) : null}
      </span>
    </span>
  );
}
