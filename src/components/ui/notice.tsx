import * as React from "react";
import { cn } from "@/lib/cn";

// Inline callout for statuses that belong in the page flow (not a toast —
// the app deliberately has none). Tones map to brand semantics: teal =
// informational, lime = good news, plum = caution/attention.
type Tone = "info" | "success" | "warning";

const tones: Record<Tone, string> = {
  info: "border-teal/25 bg-teal/[0.04] text-teal",
  success: "border-teal/25 bg-lime/30 text-teal",
  warning: "border-plum/30 bg-plum/[0.04] text-plum",
};

export function InlineNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 font-sans text-sm leading-relaxed",
        tones[tone],
        className
      )}
    >
      {title ? <strong className="font-semibold">{title}</strong> : null}
      {title ? " " : null}
      {children}
    </div>
  );
}
