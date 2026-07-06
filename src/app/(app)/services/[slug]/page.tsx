import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getServiceBySlug } from '@/lib/cms';
import { hasOpenBookingFor } from '@/lib/db/bookings';
import {
  IcoCal,
  IcoGlobe,
  IcoMegaphone,
  IcoType,
  IcoTrend,
  IcoShare,
  IcoBriefcase,
} from '@/components/dashboard/Icons';
import BookingForm from './BookingForm';

function IconFor({ icon }: { icon: string }) {
  switch (icon) {
    case 'cal': return <IcoCal />;
    case 'globe': return <IcoGlobe />;
    case 'megaphone': return <IcoMegaphone />;
    case 'type': return <IcoType />;
    case 'trend': return <IcoTrend />;
    case 'share': return <IcoShare />;
    case 'briefcase':
    default: return <IcoBriefcase />;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  return {
    title: service ? `${service.title} — Growth Hub` : 'Service — Growth Hub',
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=' + encodeURIComponent(`/services/${slug}`));

  const [service, hasBooking] = await Promise.all([
    getServiceBySlug(slug),
    hasOpenBookingFor(user.id, slug),
  ]);
  if (!service) notFound();

  return (
    <>
      <PageHeader
        kicker="Services"
        title={service.title}
        sub={service.description}
        actions={
          <Link href="/services#services">
            <button className="gh-btn ghost" type="button">
              ← All services
            </button>
          </Link>
        }
      />

      <div className="gh-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
        <div
          className={`gh-service-ic ${service.tone ?? 'teal'}`}
          style={{ flexShrink: 0, width: 72, height: 72 }}
        >
          <IconFor icon={service.icon ?? 'briefcase'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-50)', fontWeight: 600 }}>
            {service.category ?? 'service'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--teal)', margin: '4px 0 8px', letterSpacing: '-0.015em' }}>
            {service.title}
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-70)', lineHeight: 1.6 }}>
            {service.description}
          </p>
        </div>
        {service.price && (
          <div style={{ textAlign: 'right', minWidth: 160, flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--teal)' }}>
              {service.price}
            </div>
            {service.priceLabel && (
              <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 4 }}>
                {service.priceLabel}
              </div>
            )}
          </div>
        )}
      </div>

      <BookingForm
        serviceSlug={slug}
        serviceTitle={service.title}
        initiallyBooked={hasBooking}
      />
    </>
  );
}
