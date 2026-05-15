import { redirect } from 'next/navigation';
import { getSignUpUrl } from '@workos-inc/authkit-nextjs';

// Bounce visitors to the WorkOS-hosted AuthKit sign-up screen.
// Preserves `redirect_url` so users return to the right page after sign-up
// (PricingPageContent sends them here with redirect_url=/pricing).
interface Props {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  const url = await getSignUpUrl({
    returnTo: params.redirect_url ?? '/dashboard',
  });
  redirect(url);
}
