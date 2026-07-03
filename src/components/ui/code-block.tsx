"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

// Styled code/snippet block with a copy control. Pass `children` as the raw
// string, or `html` when the content is pre-highlighted markup (e.g. the
// PayloadPreview JSON highlighter) — `copyText` supplies the clipboard value
// in that case. The "Copy → Copied" flip is a text swap, matching the house
// async style.
export function CodeBlock({
  children,
  html,
  copyText,
  className,
}: {
  children?: string;
  html?: string;
  copyText?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const text = copyText ?? children ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — leave the label as-is */
    }
  };

  return (
    <div className={cn("relative", className)}>
      {text ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={copy}
          className="absolute right-2 top-2 bg-white/70 backdrop-blur-sm"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      ) : null}
      {html ? (
        <pre
          className="overflow-x-auto rounded-xl border border-line bg-eggshell-warm/60 p-4 font-mono text-xs leading-relaxed text-teal"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-line bg-eggshell-warm/60 p-4 font-mono text-xs leading-relaxed text-teal">
          {children}
        </pre>
      )}
    </div>
  );
}
