import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

// Route Handler (not a page) so that WorkOS can set the PKCE cookie before redirecting.
export async function GET(request: NextRequest) {
  // /dashboard directly: the legacy /portal only 301s there (next.config.ts).
  const returnTo = request.nextUrl.searchParams.get('redirect_url') ?? '/dashboard';
  const url = await getSignInUrl({ returnTo });
  redirect(url);
}
