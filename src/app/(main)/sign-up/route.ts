import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

// Route Handler (not a page) so that WorkOS can set the PKCE cookie before redirecting.
export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('redirect_url') ?? '/portal';
  const url = await getSignUpUrl({ returnTo });
  redirect(url);
}
