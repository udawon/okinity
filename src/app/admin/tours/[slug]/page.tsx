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

export const dynamic = 'force-dynamic';

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
    <AdminShell title="투어 5종 편집" back={{ href: '/admin/tours', label: '투어 5종 목록' }}>
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
      {lang !== 'ko' && (
        <p className="mt-3 rounded-card border border-line bg-bg/40 p-3 text-xs text-muted">
          {lang === 'en' ? 'English' : '日本語'} 버전을 편집 중입니다. 저장 전 내용은 한국어 원문이
          초안으로 표시될 수 있으며, 이 언어로 저장하지 않으면 방문자에게 한국어가 폴백으로
          보입니다.
        </p>
      )}

      <div className="mt-5 space-y-5">
        <TourEditor key={lang} slug={slug} detail={detail} lang={lang} disabled={!enabled} />
        {fishingClasses && (
          <FishingClassesForm key={`fc-${lang}`} initial={fishingClasses} lang={lang} disabled={!enabled} />
        )}
      </div>
    </AdminShell>
  );
}
