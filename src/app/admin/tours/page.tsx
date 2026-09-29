import Link from 'next/link';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { ACTIVITIES } from '@/components/ocean-home-data';
import { resolveTourDetail, tourImages, TOUR_CATALOG } from '@/lib/tour';
import AdminShell from '@/components/admin/AdminShell';
import TranslationSyncPanel from '@/components/admin/TranslationSyncPanel';
import { staleByLocale, syncItems, syncKeys } from '@/lib/content-sync-server';
import { translationEnabled } from '@/lib/translate';

export const dynamic = 'force-dynamic';
// "번역 맞추기"(서버액션)가 이 페이지 함수에서 실행 — 콘텐츠 하나 번역 대기 시간 확보
export const maxDuration = 60;

export default async function AdminToursPage() {
  const enabled = isSupabaseEnabled();
  // 번역 대상 콘텐츠 전체(투어·낚시 클래스·공통 안내·소개·갤러리)의 한·영·일 저장본과 번역 기억을 한 번에 조회
  const items = syncItems();
  const map = enabled ? await getSiteContentMap(items.flatMap((i) => syncKeys(i.key))) : {};
  const status = items.map((i) => ({ key: i.key, label: i.label, ...staleByLocale(map, i) }));
  const staleOf = Object.fromEntries(status.map((s) => [s.key, s.en + s.ja]));

  return (
    <AdminShell title={`투어 상세 · ${TOUR_CATALOG.length}개`}>
      {enabled && <TranslationSyncPanel items={status} enabled={translationEnabled()} />}

      <p className="mb-6 text-sm text-muted">
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
                const k = CONTENT_KEYS.tour(t.slug);
                const detail = resolveTourDetail(t.slug, map[k]);
                const hasContent = detail.summary || detail.body || detail.heroImage;
                const photos = tourImages(detail).length;
                const stale = staleOf[k] ?? 0;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/admin/tours/${t.slug}`}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-surface"
                    >
                      <span className="font-medium text-ink">{t.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="hidden text-xs text-muted sm:inline">
                          사진 {photos}장 · {hasContent ? (stale ? `번역 필요 ${stale}칸` : 'EN·JA 최신') : '—'}
                        </span>
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
    </AdminShell>
  );
}
