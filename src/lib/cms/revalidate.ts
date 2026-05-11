/**
 * Calls the /api/revalidate route to purge an ISR cache tag.
 * Used by Payload collection and global hooks after content changes.
 *
 * We use an HTTP call (rather than importing revalidateTag directly) so the
 * revalidation works reliably from Payload's hook context, which may run
 * outside of a Next.js request lifecycle.
 */
export async function revalidate(tag: string): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const secret = process.env.REVALIDATION_SECRET;

  if (!secret) {
    console.warn('[revalidate] REVALIDATION_SECRET is not set — skipping tag:', tag);
    return;
  }

  try {
    const res = await fetch(
      `${siteUrl}/api/revalidate?tag=${encodeURIComponent(tag)}&secret=${encodeURIComponent(secret)}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      console.error(`[revalidate] Failed for tag "${tag}": ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error(`[revalidate] Error for tag "${tag}":`, err);
  }
}
