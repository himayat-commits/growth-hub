import { handleAuth } from '@workos-inc/authkit-nextjs';

// Exchanges the WorkOS authorization code for a session cookie.
// Configure this URL as a Redirect URI in dashboard.workos.com → Redirects.
export const GET = handleAuth({ returnPathname: '/dashboard' });
