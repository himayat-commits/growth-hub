"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// Lightweight syntax-highlighted JSON.
function highlight(value: unknown): string {
  const json = JSON.stringify(value, null, 2) ?? "undefined";
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)/g, '<span class="key">"$1"</span>$2')
    .replace(/: "([^"\\]*(?:\\.[^"\\]*)*)"/g, ': <span class="str">"$1"</span>')
    .replace(/: (true|false)/g, ': <span class="bool">$1</span>')
    .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span class="num">$1</span>');
}

export function PayloadPreview({
  index,
  label,
  method,
  url,
  headers,
  body,
}: {
  index: number;
  label: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl border border-line bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-teal text-eggshell font-serif text-sm flex-shrink-0">
          {index}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-base text-teal">{label}</span>
          <span className="block text-xs text-ink-muted mt-0.5 font-sans">
            <code className="bg-eggshell-warm rounded px-1.5 py-0.5 text-[11px] mr-1.5 text-teal">
              {method}
            </code>
            <span className="break-all">{url}</span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-muted transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-line px-5 py-4 space-y-4">
          <div>
            <h4 className="font-sans text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Headers
            </h4>
            <pre className="json text-xs">
              {(headers
                ? Object.entries(headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n") + "\n"
                : "") +
                "x-api-key: ••••••••••••••••\nAccept: application/json"}
            </pre>
          </div>
          {body !== undefined ? (
            <div>
              <h4 className="font-sans text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Body
              </h4>
              <pre
                className="json"
                dangerouslySetInnerHTML={{ __html: highlight(body) }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
