import Link from 'next/link';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { ACTIVITIES } from '@/components/ocean-home-data';
import { parseTourDetail } from '@/lib/tour';
import AdminNav from '@/components/admin/AdminNav';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminToursPage() {
  const enabled = isSupabaseEnabled();
  // 모든 투어 상세를 한 번에 조회해 공개 여부 표시
  const keys = ACTIVITIES.flatMap((a) => a.tours.map((t) => CONTENT_KEYS.tour(t.slug)));
  const map = enabled ? await getSiteContentMap(keys) : {};

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">투어 상세</h1>
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

      {!enabled && (
        <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase가 연결되지 않아 투어 상세를 저장할 수 없습니다.</p>
          <p className="mt-1">
            <code>.env.local</code> 에 SUPABASE 환경변수를 설정하세요.
          </p>
        </div>
      )}

      <p className="mb-6 mt-6 text-sm text-muted">
        투어 목록은 고정되어 있고, 각 투어를 눌러 상세 내용을 등록합니다. 공개된 상세는{' '}
        <code>/tours/&#123;slug&#125;</code> 페이지에 표시됩니다.
      </p>

      <div className="space-y-8">
        {ACTIVITIES.map((a) => (
          <section key={a.id}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {a.title} <span className="text-muted/70">· {a.kicker}</span>
            </h2>
            <ul className="mt-3 divide-y divide-line rounded-card border border-line">
              {a.tours.map((t) => {
                const detail = parseTourDetail(map[CONTENT_KEYS.tour(t.slug)]);
                const hasContent = detail.summary || detail.body || detail.heroImage;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/admin/tours/${t.slug}`}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-surface"
                    >
                      <span className="font-medium text-ink">{t.name}</span>
                      <span className="flex items-center gap-3">
                        {detail.published ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            공개
                          </span>
                        ) : hasContent ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            초안
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            미작성
                          </span>
                        )}
                        <span className="text-muted">편집 →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
