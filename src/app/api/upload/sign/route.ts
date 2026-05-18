// Asset upload endpoint for the wizard's AssetUploader (logo, cover, showcase
// images). Streams the file body directly to Vercel Blob and returns the
// permanent public URL.
//
// Wired in both mock and live modes — Birdeye accepts these URLs in the
// add-media payload either way.
//
// Authentication: requires a signed-in WorkOS user whose id matches the
// onboardingId query param (we use user.id as the wizard id, so a user
// can only upload assets attached to their own onboarding state).
//
// Path convention: onboarding/<userId>/<kind>-<timestamp>-<originalFilename>
// Blob `addRandomSuffix: true` keeps overwrites of the same kind safe.

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { withAuth } from "@workos-inc/authkit-nextjs";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB hard cap

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl;
  const onboardingId = url.searchParams.get("onboardingId");
  const kind = url.searchParams.get("kind");
  const filename = url.searchParams.get("filename");

  if (!onboardingId || !kind || !filename) {
    return NextResponse.json(
      { error: "onboardingId, kind, filename query params required" },
      { status: 400 }
    );
  }
  if (onboardingId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN not configured" },
      { status: 500 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024}MB limit` },
      { status: 413 }
    );
  }

  // Sanitize filename — keep extension, replace anything risky with -.
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const safeBase = filename
    .slice(0, filename.lastIndexOf(".") === -1 ? undefined : filename.lastIndexOf("."))
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .slice(0, 80);
  const blobPath = `onboarding/${onboardingId}/${kind}-${Date.now()}-${safeBase}${ext}`;

  if (!req.body) {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  try {
    const blob = await put(blobPath, req.body, {
      access: "public",
      addRandomSuffix: false,
      contentType: req.headers.get("content-type") ?? undefined,
    });
    // mode: "mock" tells the AssetUploader to skip its secondary PUT step
    // and just record the returned publicUrl — we've already done the upload.
    return NextResponse.json({ mode: "mock", publicUrl: blob.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
