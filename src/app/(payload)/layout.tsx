import React from 'react';
import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import '@payloadcms/next/css';
import { importMap } from './admin/importMap';

// Import the Payload config. buildConfig() is async so the default export is
// Promise<SanitizedConfig>, which RootLayout accepts directly.
const config = import('@payload-config').then((m) => m.default);

// Server action that dispatches all admin UI server-function calls (form state,
// document rendering, list state, etc.). Must be 'use server' so Next.js
// serialises it to a server action reference on the client.
const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

// Payload's RootLayout renders <html>, <body>, ConfigProvider, and RootProvider
// — everything the admin UI needs. The (payload) route group uses the
// multiple-root-layouts pattern (no shared app/layout.tsx) so this is the
// sole root layout for all /admin/* and /api/* payload routes.
export default function PayloadAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
