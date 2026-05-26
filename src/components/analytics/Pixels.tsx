import Script from 'next/script';
import PixelPageView from './PixelPageView';

// Loader for the three paid-acquisition pixels: GA4, Meta Pixel, LinkedIn
// Insight Tag. Mounted once from the (main) layout — the authenticated
// (app) surface stays pixel-free for privacy.
//
// Inert by default. Each pixel only renders its <Script> tags when the
// corresponding NEXT_PUBLIC_* env var is set, so dev / preview /
// pre-account-setup environments ship nothing.
//
// Conversion events are fired from src/lib/analytics.ts:track() — this
// file only handles the page-load init + per-route pageviews. See the
// trackPixelEvent() function in analytics.ts for the PostHog → GA4/Meta/
// LinkedIn event-name mapping.
//
// `strategy="afterInteractive"` keeps these from blocking first paint.
// PostHog uses the same strategy; matching it avoids surprise ordering.

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

export default function Pixels() {
  const anyEnabled = Boolean(GA4_ID || META_PIXEL_ID || LINKEDIN_PARTNER_ID);
  if (!anyEnabled) return null;

  return (
    <>
      {GA4_ID && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              // App Router fires pageviews manually via PixelPageView —
              // disable the auto pageview so we don't double-count.
              gtag('config', '${GA4_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            // Initial PageView fires here; route changes are handled by
            // PixelPageView so SPA navigations register on Meta too.
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {LINKEDIN_PARTNER_ID && (
        <>
          <Script id="linkedin-partner-id" strategy="afterInteractive">
            {`
              _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            `}
          </Script>
          <Script id="linkedin-insight" strategy="afterInteractive">
            {`
              (function(l) {
                if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                window.lintrk.q=[]}
                var s = document.getElementsByTagName("script")[0];
                var b = document.createElement("script");
                b.type = "text/javascript";b.async = true;
                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b, s);
              })(window.lintrk);
            `}
          </Script>
        </>
      )}

      <PixelPageView />
    </>
  );
}
