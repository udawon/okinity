import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Container from '@/components/Container';
import {
  getLocalizedSiteContent,
  getSiteContentMap,
  localizedContentKey,
  CONTENT_KEYS
} from '@/lib/site-content';
import {
  classPrice,
  getTourCatalogEntry,
  resolveTourDetail,
  parseFishingClasses,
  splitLines,
  tourHasClasses,
  tourImages,
  TOUR_NAME_NAV_KEY
} from '@/lib/tour';
import { cdnMedia } from '@/lib/media';
import { localeAlternates } from '@/lib/seo';
import ReserveCta from '@/components/ReserveCta';
import TourClassSection from '@/components/TourClassSection';
import TourPhotoCarousel from '@/components/TourPhotoCarousel';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = getTourCatalogEntry(slug);
  if (!entry) return {}; // 카탈로그에 없으면(404) 부모 기본값 상속(타이틀 중복 방지)
  // 표시명은 로케일별(nav 키). title 템플릿('%s | OKINITY')이 브랜드를 자동으로 붙인다.
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const navKey = TOUR_NAME_NAV_KEY[slug];
  const tourName = navKey ? tNav(navKey) : entry.name;
  const detail = resolveTourDetail(
    slug,
    await getLocalizedSiteContent(CONTENT_KEYS.tour(slug), locale)
  );
  const t = await getTranslations({ locale, namespace: 'tourDetail' });
  const description = detail.summary?.trim() || t('metaFallback', { name: tourName });
  return {
    title: tourName,
    description,
    alternates: localeAlternates(locale, `/tours/${slug}`)
  };
}

export default async function TourDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const entry = getTourCatalogEntry(slug);
  if (!entry) notFound();

  const tNav = await getTranslations('nav');
  const t = await getTranslations('tourDetail');
  // 표시명·카테고리명은 로케일별(nav 키). 매핑 없으면 카탈로그 한국어명으로 폴백.
  const navKey = TOUR_NAME_NAV_KEY[slug];
  const tourName = navKey ? tNav(navKey) : entry.name;
  const categoryName = tNav(entry.categoryId);

  // ko 키와 로케일 키를 한 쿼리로 조회 — 텍스트는 로케일 우선(없으면 ko 폴백, 기존 동작),
  // 사진(images)은 언어 중립 자산이라 항상 ko 키 값에서 해석한다(ko에서 교체하면 전 언어 즉시 반영).
  const tourKey = CONTENT_KEYS.tour(slug);
  const localizedKey = localizedContentKey(tourKey, locale);
  const contentMap = await getSiteContentMap(
    locale === 'ko' ? [tourKey] : [tourKey, localizedKey]
  );
  const detail = resolveTourDetail(slug, contentMap[localizedKey] ?? contentMap[tourKey] ?? null);
  const images = tourImages(resolveTourDetail(slug, contentMap[tourKey] ?? null));
  const showDetail = detail.published;
  const included = splitLines(detail.included);
  const showClasses = tourHasClasses(slug); // 낚시 투어 → 클래스(미들/럭셔리) 탭 노출
  // 클래스는 낚시 공통(단일 키) — 모든 낚시 투어가 동일한 미들/럭셔리 콘텐츠를 공유.
  const fishingClasses = showClasses
    ? parseFishingClasses(await getLocalizedSiteContent(CONTENT_KEYS.fishingClasses, locale))
    : null;
  // 카테고리 허브 페이지가 없으므로(diving·padi는 대표 투어로 redirect) 모든 투어가
  // 홈의 액티비티 섹션으로 일관되게 복귀한다. (이전: 카테고리별로 행선지가 제각각이었음)
  const hubHref = '/#activities';

  const meta = [
    detail.duration && { label: t('durationLabel'), value: detail.duration },
    detail.price && { label: t('priceLabel'), value: detail.price }
  ].filter(Boolean) as { label: string; value: string }[];

  // 공통 본문(포함 사항 + 상세 본문) — 낚시는 클래스 구획의 children, 비낚시는 본문 흐름에 그대로.
  const commonSections = (
    <>
      {showDetail && included.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl text-white">{t('includesTitle')}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {included.map((it) => (
              <li key={it} className="flex items-center gap-2 text-sm text-white/80">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.accent }}
                />
                {it}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDetail && detail.body && (
        <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
          {detail.body}
        </div>
      )}
    </>
  );

  return (
    <article className="py-14 sm:py-20">
      <Container className="max-w-3xl [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
        <Link href={hubHref} className="text-sm text-white/55 transition-colors hover:text-white">
          ← {categoryName}
        </Link>

        {showDetail && images.length > 0 && (
          <TourPhotoCarousel images={images.map(cdnMedia)} alt={tourName} />
        )}

        <header className="mt-7">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: entry.accent }}
          >
            {entry.categoryKicker}
          </p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-tight text-white sm:text-5xl">
            {tourName}
          </h1>
          {showDetail && detail.summary && (
            <p className="mt-4 text-lg leading-relaxed text-white/80">{detail.summary}</p>
          )}
        </header>

        {showClasses && fishingClasses ? (
          // 낚시: 클래스 선택(미들/럭셔리)이 최상단 — 가격 메타·요트 사진+스펙이 선택에 따라
          // 전환되고, 선택은 예약 CTA(?class=)까지 이어진다. 구획 자체는 공개 여부 무관 상시 노출.
          <TourClassSection
            classes={fishingClasses}
            prices={{
              middle: classPrice(detail, 'middle'),
              luxury: classPrice(detail, 'luxury'),
              fallback: detail.price
            }}
            duration={detail.duration}
            showMeta={showDetail}
            slug={slug}
            accent={entry.accent}
            labels={{
              title: t('classTitle'),
              middle: t('classMiddle'),
              luxury: t('classLuxury'),
              preparing: t('classPreparing'),
              durationLabel: t('durationLabel'),
              priceLabel: t('priceLabel'),
              reserveCta: t('reserveCta')
            }}
          >
            {commonSections}
          </TourClassSection>
        ) : (
          <>
            {showDetail && meta.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5">
                {meta.map((m) => (
                  <div key={m.label}>
                    <div className="text-[11px] uppercase tracking-wider text-white/55">
                      {m.label}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {commonSections}

            {!(showDetail && detail.body) && (
              <p className="mt-8 text-[15px] leading-relaxed text-white/65">{t('preparing')}</p>
            )}

            <ReserveCta href={`/reserve?tour=${slug}`} label={t('reserveCta')} />
          </>
        )}
      </Container>
    </article>
  );
}
