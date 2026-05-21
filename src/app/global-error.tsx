'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Catches the rare app-router boundary failures that the per-segment
// error.tsx can't handle (root layout crashes, RSC stream errors).
// Reports to Sentry then falls back to Next's default error UI.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
