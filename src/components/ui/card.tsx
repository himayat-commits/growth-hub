import * as React from "react";
import { cn } from "@/lib/cn";

// Cards on the brand site are 24px-radius. Eggshell page background, white
// (or paper) card surface, line-coloured borders, soft drop shadow.

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white shadow-soft",
        className
      )}
      {...props}
    />
  );
}
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-7 pb-3", className)} {...props} />;
}
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-serif text-xl text-teal tracking-tight", className)}
      {...props}
    />
  );
}
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-ink-muted leading-relaxed", className)} {...props} />
  );
}
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-7 pt-3", className)} {...props} />;
}
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-7 pt-0 flex items-center gap-3", className)} {...props} />
  );
}

// Pills used for module badges, status indicators, etc. Lime = featured /
// good news, teal = neutral, plum = caution.
export function Pill({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "teal" | "plum" | "lime" | "lavender" | "amber" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    default: "bg-eggshell-warm text-teal",
    teal: "bg-teal/10 text-teal",
    plum: "bg-plum/10 text-plum",
    lime: "bg-lime text-teal",
    lavender: "bg-lavender/40 text-plum",
    amber: "bg-lime-soft text-teal",
    green: "bg-lime text-teal",
    red: "bg-plum/15 text-plum",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-sans font-medium tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// Section label as used on the brand site: small uppercase + dash leader.
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("section-label", className)}>{children}</span>;
}
