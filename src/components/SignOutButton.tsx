"use client";

import { signOut } from "@workos-inc/authkit-nextjs";

// Client component that triggers WorkOS sign-out. signOut() is a Server
// Action exported from authkit-nextjs — calling it from a form action keeps
// the cookie clearing + redirect on the server where it belongs.

export default function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action={signOut as () => Promise<void>}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
