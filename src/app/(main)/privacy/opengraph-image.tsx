// /privacy shares the site-wide card. It needs its own file because the page
// sets its own `openGraph` (for og:url / og:title), which replaces the
// inherited image. Config is declared here, not re-exported: Next reads
// `runtime` statically.

import SiteOgImage from '../opengraph-image';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub by Himayat — Your business deserves to grow.';

export default SiteOgImage;
