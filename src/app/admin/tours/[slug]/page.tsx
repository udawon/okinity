import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { getTourCatalogEntry, parseTourDetail } from '@/lib/tour';
import AdminNav from '@/components/admin/AdminNav';
import TourEditor from '@/components/admin/TourEditor';
import { logout } from '../../actions';

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
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">투어 상세 편집</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-button border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            로그아웃
          </button>
        </form>
      </div>

      <div className="mt-4">
        <AdminNav />
      </div>

      <div className="mt-6">
        <Link href="/admin/tours" className="text-sm text-muted hover:text-ink">
          ← 투어 상세 목록
        </Link>
      </div>

      <div className="mt-4">
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
    </main>
  );
}
