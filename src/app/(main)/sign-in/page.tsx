import { redirect } from 'next/navigation';
import { getSignInUrl } from '@workos-inc/authkit-nextjs';

// Bounce visitors to the WorkOS-hosted AuthKit sign-in screen.
// We preserve any `redirect_url` query param so the user lands back on the
// page they came from after authenticating (used by PricingPageContent).
interface Props {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const url = await getSignInUrl({
    returnTo: params.redirect_url ?? '/dashboard',
  });
  redirect(url);
}
