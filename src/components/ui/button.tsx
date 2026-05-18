"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

// Pill buttons, brand-matched.
//   primary    = teal bg, eggshell text (the workhorse)
//   secondary  = transparent, teal text + border (inverse on hover)
//   lime       = bright lime CTA (used sparingly — most popular, primary action)
//   outline    = white card on eggshell
//   ghost      = quiet inline action (back, cancel)
//   danger     = red — destructive only

type Variant = "primary" | "secondary" | "lime" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-teal text-eggshell hover:bg-teal-deep hover:-translate-y-px shadow-sm",
  secondary:
    "bg-transparent text-teal border border-teal/35 hover:bg-teal hover:text-eggshell hover:border-teal",
  lime: "bg-lime text-teal hover:brightness-95 hover:-translate-y-px shadow-sm",
  outline:
    "bg-white text-teal border border-line hover:border-teal/50 hover:-translate-y-px",
  ghost: "bg-transparent text-teal hover:bg-teal/5",
  danger: "bg-plum text-eggshell hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", size = "md", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight",
          "transition-[background-color,color,transform,border-color] duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-eggshell",
          "disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
