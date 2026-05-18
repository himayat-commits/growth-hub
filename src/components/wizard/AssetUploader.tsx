"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { UploadCloud, ImageIcon, X } from "lucide-react";

export function AssetUploader({
  label,
  hint,
  kind,
  onboardingId,
  required,
  value,
  onChange,
  accept = "image/png,image/jpeg",
  maxBytes = 5 * 1024 * 1024,
}: {
  label: string;
  hint?: string;
  kind: string;
  onboardingId: string;
  required?: boolean;
  value?: string;
  onChange: (url: string | undefined) => void;
  accept?: string;
  maxBytes?: number;
}) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string>();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    setErr(undefined);
    if (f.size > maxBytes) {
      setErr(
        `File is ${(f.size / 1024 / 1024).toFixed(1)}MB — max ${(maxBytes / 1024 / 1024).toFixed(0)}MB.`
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingId, kind, filename: f.name }),
      });
      const data = await res.json();
      if (data.mode === "live") {
        await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": f.type },
          body: f,
        });
      }
      onChange(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-sans text-sm font-medium text-teal">
          {label} {required ? <span className="text-plum">*</span> : null}
        </span>
        {value ? (
          <Button size="sm" variant="ghost" onClick={() => onChange(undefined)}>
            <X className="h-3.5 w-3.5" /> Remove
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-ink-muted mb-2 leading-relaxed">{hint}</p> : null}

      {value ? (
        <div className="rounded-2xl overflow-hidden border border-line bg-eggshell-warm/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="max-h-48 w-auto object-contain mx-auto"
          />
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center cursor-pointer",
            "transition-colors hover:border-teal hover:bg-lime-soft/40"
          )}
        >
          <UploadCloud className="mx-auto h-8 w-8 text-teal" />
          <p className="mt-2 font-sans text-sm font-medium text-teal">
            Click or drop to upload
          </p>
          <p className="text-xs text-ink-muted mt-1">
            {accept.replace("image/", "").toUpperCase()}
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
      )}
      {busy ? (
        <p className="mt-2 text-xs font-sans text-ink-muted">Uploading…</p>
      ) : null}
      {err ? <p className="mt-2 text-xs font-sans text-plum">{err}</p> : null}
      {!value && !busy ? (
        <p className="mt-2 text-xs font-sans text-ink-muted flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          We&apos;ll send the URL to Birdeye — never the file bytes.
        </p>
      ) : null}
    </div>
  );
}
