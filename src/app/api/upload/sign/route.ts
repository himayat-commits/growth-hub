// Asset upload sign endpoint.
//
// Stub for now: returns a placeholder publicUrl per (onboardingId, kind, filename)
// so the wizard can be completed end-to-end against the mock Birdeye
// provisioning flow. The placeholder URLs are clearly marked as such and
// will not work against the live Birdeye API.
//
// TODO (before flipping NEXT_PUBLIC_PROVISION_MODE=live): replace this with
// a Vercel Blob put() that writes the file body to permanent storage and
// returns the real `*.public.blob.vercel-storage.com` URL. The Blob token
// is already in env (BLOB_READ_WRITE_TOKEN — used by Payload).
//
// The current AssetUploader expects { mode, uploadUrl?, publicUrl }. Returning
// mode "mock" makes the client skip the upload PUT and just record the URL.

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

export const runtime = "nodejs";

interface SignRequest {
  onboardingId: string;
  kind: string;
  filename: string;
}

const PROVISION_MODE = process.env.NEXT_PUBLIC_PROVISION_MODE === "live" ? "live" : "mock";

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as SignRequest | null;
  if (!body?.onboardingId || !body.kind || !body.filename) {
    return NextResponse.json({ error: "onboardingId, kind, filename required" }, { status: 400 });
  }

  if (body.onboardingId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (PROVISION_MODE === "live") {
    // TODO: implement real Vercel Blob upload here before going live.
    // For now refuse to upload in live mode rather than write garbage URLs
    // into the Birdeye payload.
    return NextResponse.json(
      { error: "Asset uploads not yet wired for live mode. Wire Vercel Blob in /api/upload/sign before NEXT_PUBLIC_PROVISION_MODE=live." },
      { status: 501 }
    );
  }

  // Mock mode: return a clearly-marked placeholder URL so the wizard can be
  // completed end-to-end against the mock Birdeye client.
  const safeKind = encodeURIComponent(body.kind);
  const safeFilename = encodeURIComponent(body.filename);
  const placeholderUrl = `https://placehold.co/600x400/0D3F48/F3F0E7?text=${safeKind}-${safeFilename}`;
  return NextResponse.json({
    mode: "mock",
    publicUrl: placeholderUrl,
  });
}
