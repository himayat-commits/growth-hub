import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from '../importMap';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

// import('@payload-config') returns the module namespace, so we need .default
// to extract the SanitizedConfig that Payload's view helpers expect.
const configPromise = import('@payload-config').then((m) => m.default);

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config: configPromise, params, searchParams });

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config: configPromise, importMap, params, searchParams });
}
