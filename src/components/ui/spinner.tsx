import * as React from "react";
import { cn } from "@/lib/cn";

// The single loading affordance for the app. House async style is a text
// label that states what's happening ("Saving…", "Launching…") — the spinner
// never replaces that label, it sits beside it. On dark/teal surfaces pass
// className="border-eggshell/30 border-t-eggshell".
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-teal/25 border-t-teal",
        "animate-spin motion-reduce:animate-none",
        className
      )}
    />
  );
}
