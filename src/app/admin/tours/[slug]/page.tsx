import { notFound } from 'next/navigation';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { getTourCatalogEntry, parseTourDetail } from '@/lib/tour';
import AdminShell from '@/components/admin/AdminShell';
import TourEditor from '@/components/admin/TourEditor';

export const dynamic = 'force-dynamic';

export default async function AdminTourEditPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getTourCatalogEntry(slug);
  if (!entry) notFound();

  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.tour(slug)) : null;
  const detail = parseTourDetail(value);

  return (
    <AdminShell title="투어 4종 편집" back={{ href: '/admin/tours', label: '투어 4종 목록' }}>
      <div>
        <p className="text-sm text-muted">
          {entry.categoryTitle} · {entry.categoryKicker}
        </p>
        <h2 className="mt-1 text-xl font-bold text-ink">{entry.name}</h2>
        <p className="mt-1 text-xs text-muted">
          공개 주소: <code>/tours/{slug}</code>
        </p>
      </div>

      <div className="mt-5">
        <TourEditor slug={slug} detail={detail} disabled={!enabled} />
      </div>
    </AdminShell>
  );
}
