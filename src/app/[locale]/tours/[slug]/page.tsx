import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Container from '@/components/Container';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { getTourCatalogEntry, parseTourDetail, splitLines, TOUR_NAME_NAV_KEY } from '@/lib/tour';
import { cdnMedia } from '@/lib/media';

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
  return { title: navKey ? tNav(navKey) : entry.name };
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

  const value = await getSiteContent(CONTENT_KEYS.tour(slug));
  const detail = parseTourDetail(value);
  const showDetail = detail.published;
  const included = splitLines(detail.included);
  // 카테고리 허브 페이지가 없으므로(diving·padi는 대표 투어로 redirect) 모든 투어가
  // 홈의 액티비티 섹션으로 일관되게 복귀한다. (이전: 카테고리별로 행선지가 제각각이었음)
  const hubHref = '/#activities';

  const meta = [
    detail.duration && { label: t('durationLabel'), value: detail.duration },
    detail.price && { label: t('priceLabel'), value: detail.price }
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="py-14 sm:py-20">
      <Container className="max-w-3xl [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
        <Link href={hubHref} className="text-sm text-white/55 transition-colors hover:text-white">
          ← {categoryName}
        </Link>

        {showDetail && detail.heroImage && (
          <div className="mt-6 overflow-hidden rounded-card border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cdnMedia(detail.heroImage)}
              alt={tourName}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <header className="mt-7">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: entry.accent }}
          >
            {entry.categoryKicker}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">
            {tourName}
          </h1>
          {showDetail && detail.summary && (
            <p className="mt-4 text-lg leading-relaxed text-white/80">{detail.summary}</p>
          )}
        </header>

        {showDetail && meta.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5">
            {meta.map((m) => (
              <div key={m.label}>
                <div className="text-[11px] uppercase tracking-wider text-white/55">{m.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-white">{m.value}</div>
              </div>
            ))}
          </div>
        )}

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

        {showDetail && detail.body ? (
          <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
            {detail.body}
          </div>
        ) : (
          <p className="mt-8 text-[15px] leading-relaxed text-white/65">
            {t('preparing')}
          </p>
        )}

        <div className="mt-10">
          <Link
            href={`/reserve?tour=${slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300"
          >
            {t('reserveCta')}
          </Link>
        </div>
      </Container>
    </article>
  );
}
