"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors",
          checked ? "bg-teal" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
      {label ? <span className="text-sm font-sans text-ink">{label}</span> : null}
    </label>
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-sans">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-line text-teal focus:ring-teal/40"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors",
        active
          ? "bg-teal text-eggshell border-teal"
          : "bg-white text-teal border-line hover:border-teal/45",
        className
      )}
    >
      {children}
    </button>
  );
}
