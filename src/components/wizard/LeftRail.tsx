"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useStepCompletion } from "@/components/wizard/WizardContext";
import { Logo } from "@/components/brand/Logo";
import { CheckCircle2, Circle } from "lucide-react";

// Eggshell-warm column on the brand palette — calmer than the previous
// navy-on-white. Active step highlighted with a teal/lime accent.

export function LeftRail() {
  const path = usePathname();
  const steps = useStepCompletion();

  return (
    <aside className="hidden md:flex md:flex-col w-72 flex-shrink-0 bg-eggshell-warm border-r border-line min-h-screen">
      <div className="p-7 border-b border-line">
        <Logo />
        <p className="mt-2 text-xs text-ink-muted font-sans tracking-wide uppercase">
          Customer onboarding
        </p>
      </div>
      <nav className="p-3 flex-1">
        <ol className="space-y-0.5">
          {steps.map((s, i) => {
            const active = path?.includes(`/onboarding/${s.key}`);
            return (
              <li key={s.key}>
                <Link
                  href={`/onboarding/${s.key}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-sans transition-colors",
                    active
                      ? "bg-teal text-eggshell shadow-sm"
                      : "text-teal/85 hover:bg-white/60"
                  )}
                >
                  {s.complete ? (
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        active ? "text-lime" : "text-teal"
                      )}
                    />
                  ) : (
                    <Circle
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        active ? "text-eggshell/60" : "text-ink-muted/40"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "text-xs w-5 font-medium",
                      active ? "text-eggshell/70" : "text-ink-muted/50"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{s.title}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="p-7 border-t border-line">
        <p className="font-sans text-[12px] font-semibold tracking-[0.12em] uppercase text-plum">
          Need a hand?
        </p>
        <p className="mt-1 text-xs text-ink-muted leading-relaxed">
          Email your partner — your onboarding ID is on every email.
        </p>
      </div>
    </aside>
  );
}
