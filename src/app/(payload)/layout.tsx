import React from 'react';
import { RootLayout } from '@payloadcms/next/layouts';
import '@payloadcms/next/css';
import { importMap } from './admin/importMap';

// Import the Payload config.  buildConfig() is async so m.default is
// Promise<SanitizedConfig>, which RootLayout accepts directly.
const config = import('@payload-config').then((m) => m.default);

// Payload's RootLayout renders <html>, <body>, ConfigProvider, RootProvider,
// and the ProgressBar — everything the admin UI needs to function correctly.
// It must wrap all (payload) routes so that useConfig() has a valid context.
export default function PayloadAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout config={config} importMap={importMap}>
      {children}
    </RootLayout>
  );
}
