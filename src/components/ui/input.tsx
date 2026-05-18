"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

const baseField =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink font-sans " +
  "placeholder:text-ink-muted/60 " +
  "focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal " +
  "disabled:opacity-50 transition-[border-color,box-shadow] duration-150";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(baseField, className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(baseField, "min-h-24 leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(baseField, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
});

export function Label({
  className,
  children,
  hint,
  required,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  hint?: string;
  required?: boolean;
}) {
  return (
    <label
      className={cn("flex flex-col gap-1.5 text-sm font-sans font-medium text-teal", className)}
      {...rest}
    >
      <span className="flex items-center gap-1">
        {children}
        {required ? <span className="text-plum">*</span> : null}
      </span>
      {hint ? <span className="text-xs font-normal text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-sans text-plum">{message}</p>;
}
