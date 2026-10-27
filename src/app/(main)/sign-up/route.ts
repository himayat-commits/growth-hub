import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { PORTAL_PARKED } from '@/lib/portal';

// Route Handler (not a page) so that WorkOS can set the PKCE cookie before redirecting.
export async function GET(request: NextRequest) {
  // Portal parked (stage 0): no new member accounts, so would-be sign-ups go
  // to the Sessions calendar instead of WorkOS.
  if (PORTAL_PARKED) redirect('/events');

  const returnTo = request.nextUrl.searchParams.get('redirect_url') ?? '/portal';
  const url = await getSignUpUrl({ returnTo });
  redirect(url);
}
