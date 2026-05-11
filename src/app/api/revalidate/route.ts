import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate?tag=<tag>&secret=<REVALIDATION_SECRET>
 *
 * Called by Payload CMS collection and global hooks after content changes.
 * Purges the given unstable_cache tag so the next request fetches fresh data.
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const tag = req.nextUrl.searchParams.get('tag');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: 'tag query parameter is required' }, { status: 400 });
  }

  // Next.js 16 requires a second profile argument. 'max' means stale-while-revalidate:
  // serve cached content while fresh data is fetched in the background.
  revalidateTag(tag, 'max');

  return NextResponse.json({ revalidated: true, tag, now: Date.now() });
}
