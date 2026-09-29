import { notFound } from 'next/navigation';
import {
  getSiteContent,
  CONTENT_KEYS,
  localizedContentKey,
  isContentLocale
} from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { getTourCatalogEntry, resolveTourDetail, parseFishingClasses, tourHasClasses } from '@/lib/tour';
import AdminShell from '@/components/admin/AdminShell';
import TourEditor from '@/components/admin/TourEditor';
import FishingClassesForm from '@/components/admin/FishingClassesForm';
import LangTabs from '@/components/admin/LangTabs';
import AutoTranslateNote from '@/components/admin/AutoTranslateNote';

export const dynamic = 'force-dynamic';
// 한국어 저장 시 EN/JA 자동 번역(서버액션이 이 페이지 함수에서 실행) — 번역 대기 시간 확보
export const maxDuration = 60;

export default async function AdminTourEditPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const entry = getTourCatalogEntry(slug);
  if (!entry) notFound();
  const { lang: rawLang } = await searchParams;
  const lang = isContentLocale(rawLang) ? rawLang : 'ko';

  const enabled = isSupabaseEnabled();
  // 편집 대상 언어의 저장값. en/ja가 아직 없으면 한국어 값을 번역 초안으로 프리필.
  const value = enabled
    ? await getSiteContent(localizedContentKey(CONTENT_KEYS.tour(slug), lang))
    : null;
  const fallback =
    value == null && lang !== 'ko' && enabled
      ? await getSiteContent(CONTENT_KEYS.tour(slug))
      : null;
  const detail = resolveTourDetail(slug, value ?? fallback);
  // 번역 탭의 옵션 기준(요금·순서) = 한국어 저장본. 번역본이 없으면 fallback 이 이미 한국어 값이다.
  const baseOptions =
    lang === 'ko'
      ? undefined
      : resolveTourDetail(slug, fallback ?? (enabled ? await getSiteContent(CONTENT_KEYS.tour(slug)) : null)).options;

  // 낚시 투어면 공통 클래스(미들/럭셔리)도 함께 편집 — 단일 키라 4종 전체에 동기화.
  const showClasses = tourHasClasses(slug);
  const classesValue = showClasses && enabled
    ? await getSiteContent(localizedContentKey(CONTENT_KEYS.fishingClasses, lang))
    : null;
  const classesFallback =
    showClasses && classesValue == null && lang !== 'ko' && enabled
      ? await getSiteContent(CONTENT_KEYS.fishingClasses)
      : null;
  const fishingClasses = showClasses
    ? parseFishingClasses(classesValue ?? classesFallback)
    : null;

  return (
    <AdminShell title="투어 상세 편집" back={{ href: '/admin/tours', label: '투어 상세 목록' }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {entry.categoryTitle} · {entry.categoryKicker}
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink">{entry.name}</h2>
          <p className="mt-1 text-xs text-muted">
            공개 주소: <code>/tours/{slug}</code>
          </p>
        </div>
        <LangTabs basePath={`/admin/tours/${slug}`} current={lang} />
      </div>
      <AutoTranslateNote lang={lang} className="mt-3" />

      <div className="mt-5 space-y-5">
        <TourEditor key={lang} slug={slug} detail={detail} lang={lang} baseOptions={baseOptions} disabled={!enabled} />
        {fishingClasses && (
          <FishingClassesForm key={`fc-${lang}`} initial={fishingClasses} lang={lang} disabled={!enabled} />
        )}
      </div>
    </AdminShell>
  );
}
