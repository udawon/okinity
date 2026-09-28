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
  bookableOptions,
  classPrice,
  extractAgeRange,
  getTourCatalogEntry,
  resolveTourDetail,
  parseFishingClasses,
  splitLines,
  tourHasClasses,
  tourImages,
  TOUR_NAME_NAV_KEY
} from '@/lib/tour';
import { parseTourBody, isRuleSection, withoutFlowBlocks, type BodyBlock, type ParsedBody } from '@/lib/tour-body';
import { activeNoticeIds, parseTourNotices, sectionCoveredByNotice } from '@/lib/tour-notices';
import { parseTourTimes } from '@/lib/tour-times';
import { getJpyKrwRate } from '@/lib/exchange-rate';
import { cdnMedia } from '@/lib/media';
import { localeAlternates } from '@/lib/seo';
import { site } from '@/config/site.config';
import TourGallery from '@/components/tour/TourGallery';
import TourSectionNav from '@/components/tour/TourSectionNav';
import TourFacts, { type TourFact } from '@/components/tour/TourFacts';
import TourBlocks from '@/components/tour/TourBlocks';
import TourSteps from '@/components/tour/TourSteps';
import Icon from '@/components/tour/icons';
import {
  BookingCard,
  MobileBookBar,
  TourBookingProvider,
  TourClassCards,
  TourOptionCards,
  type BookingInfo
} from '@/components/tour/TourBooking';

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

/** 섹션 제목 — 모바일 목차 칩이 id 로 이동한다(고정 헤더만큼 여백). */
function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-[124px] font-serif text-2xl leading-snug text-white sm:scroll-mt-[172px] sm:text-[26px] lg:scroll-mt-32">
      {children}
    </h2>
  );
}

/** 공통 안내 본문(표기법 동일)을 한 덩어리 블록으로 — 안쪽 ★제목★ 은 소제목으로. */
function flattenBody(parsed: ParsedBody): BodyBlock[] {
  return [
    ...parsed.intro,
    ...parsed.sections.flatMap((s) => [{ type: 'subhead', text: s.title } as BodyBlock, ...s.blocks])
  ];
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

  // 한 번의 조회로: 투어(ko·로케일), 투어 시간대, 공통 안내(그 언어 키 — 한국어로 폴백하지 않음).
  const tourKey = CONTENT_KEYS.tour(slug);
  const localizedKey = localizedContentKey(tourKey, locale);
  const noticesKey = localizedContentKey(CONTENT_KEYS.tourNotices, locale);
  const contentMap = await getSiteContentMap(
    Array.from(new Set([tourKey, localizedKey, CONTENT_KEYS.tourTimes, noticesKey]))
  );
  // 텍스트는 로케일 우선(없으면 ko 폴백). 사진·요금 숫자·공통 안내 켜기는 언어 중립이라 항상 ko 키 값.
  const detail = resolveTourDetail(slug, contentMap[localizedKey] ?? contentMap[tourKey] ?? null);
  const base = resolveTourDetail(slug, contentMap[tourKey] ?? null);
  const images = tourImages(base).map(cdnMedia);
  const showDetail = detail.published;
  const included = splitLines(detail.included);
  const times = parseTourTimes(contentMap[CONTENT_KEYS.tourTimes])[slug] ?? [];

  const showClasses = tourHasClasses(slug); // 낚시 투어 → 클래스(미들/럭셔리) 카드
  // 클래스는 낚시 공통(단일 키) — 모든 낚시 투어가 동일한 미들/럭셔리 콘텐츠를 공유.
  const fishingClasses = showClasses
    ? parseFishingClasses(await getLocalizedSiteContent(CONTENT_KEYS.fishingClasses, locale))
    : null;
  const classPrices =
    showClasses && (classPrice(detail, 'middle') || classPrice(detail, 'luxury'))
      ? { middle: classPrice(detail, 'middle'), luxury: classPrice(detail, 'luxury') }
      : null;
  // 선택 옵션(예: 일반 / 프라이빗) — 요금은 한국어 저장본, 이름·설명은 이 언어 저장본.
  const options = bookableOptions(slug, base, detail);

  // 원화 참고는 한국어 페이지에서만, 실시간 환율을 받았을 때만(폴백 환율은 오해 소지).
  const rate = locale === 'ko' ? await getJpyKrwRate() : null;

  // ── 본문 자동 서식 + 공통 안내 ──
  // 진행 순서 칸을 채웠으면 본문의 "A -> B" 흐름 그림은 빼서 같은 그림이 두 번 나오지 않게 한다.
  const steps = detail.steps.filter((s) => s.name.trim());
  const body = showDetail ? parseTourBody(detail.body) : { intro: [], sections: [] };
  const parsed = steps.length ? withoutFlowBlocks(body) : body;
  const active = showDetail ? activeNoticeIds(base.notices) : [];
  const notices = active.length ? parseTourNotices(contentMap[noticesKey], locale) : null;
  const bodySections = parsed.sections.filter((s) => !sectionCoveredByNotice(s.title, active));
  const mainSections = bodySections.filter((s) => !isRuleSection(s.title));
  const rules = [
    ...active.map((id) => ({ title: notices![id].title, blocks: flattenBody(parseTourBody(notices![id].body)) })),
    ...bodySections.filter((s) => isRuleSection(s.title))
  ];

  // ── 요약 타일(값이 있는 것만) ──
  const age = detail.age.trim() || (() => {
    const r = extractAgeRange(detail.body);
    return r ? t('ageRange', r) : '';
  })();
  const facts: TourFact[] = showDetail
    ? ([
        detail.duration && { icon: 'clock', label: t('factDuration'), value: detail.duration },
        (times.length || detail.startNote) && {
          icon: 'calendar',
          label: t('factStart'),
          value: times.length ? times.join(' · ') : detail.startNote
        },
        age && { icon: 'id', label: t('factAge'), value: age },
        detail.people && { icon: 'users', label: t('factPeople'), value: detail.people }
      ].filter(Boolean) as TourFact[])
    : [];

  const booking: BookingInfo = {
    slug,
    pricing: {
      priceMode: base.priceMode,
      pricePerPerson: base.pricePerPerson,
      priceSolo: base.priceSolo,
      priceTiers: base.priceTiers
    },
    priceText: showDetail ? detail.price : '',
    classPrices: showDetail ? classPrices : null,
    hasClasses: showClasses,
    options,
    times,
    startNote: showDetail ? detail.startNote : '',
    rate: rate?.live ? rate.jpyKrw : null,
    kakaoUrl: site.contact.kakaoChannel
  };

  // 모바일·태블릿 섹션 탭 — 실제로 보이는 섹션만(맨 앞 '개요'는 컴포넌트 호출부에서 추가)
  const toc = [
    fishingClasses && { id: 'class', label: t('classTitle') },
    options.length > 0 && { id: 'option', label: t('optionTitle') },
    showDetail && steps.length > 0 && { id: 'steps', label: t('stepsTitle') },
    showDetail && included.length > 0 && { id: 'included', label: t('includesTitle') },
    ...mainSections.map((s, i) => ({ id: `s${i}`, label: s.title })),
    rules.length > 0 && { id: 'rules', label: t('rulesTitle') }
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <article className="break-keep pb-32 pt-6 sm:pt-10 lg:pb-24">
      <TourBookingProvider options={options}>
        <Container>
          <nav aria-label={t('crumbLabel')} className="flex items-center gap-2 text-sm text-white/60">
            <Link href="/#activities" className="transition-colors hover:text-white">
              {categoryName}
            </Link>
            <span aria-hidden>/</span>
            <span className="truncate text-white/80">{tourName}</span>
          </nav>

          {showDetail && images.length > 0 && <TourGallery images={images} alt={tourName} />}

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
            <div className="min-w-0">
              <header id="overview" className="scroll-mt-[124px] [text-shadow:0_2px_14px_rgba(0,0,0,0.55)] sm:scroll-mt-[172px] lg:scroll-mt-32">
                <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: entry.accent }}>
                  {entry.categoryKicker}
                </p>
                <h1 className="mt-3 text-balance font-serif text-4xl leading-tight text-white sm:text-5xl">
                  {tourName}
                </h1>
                {showDetail && detail.summary && (
                  <p className="mt-4 text-lg leading-relaxed text-white/85">{detail.summary}</p>
                )}
              </header>

              <TourFacts facts={facts} />

              {toc.length >= 2 && (
                <TourSectionNav items={[{ id: 'overview', label: t('tocOverview') }, ...toc]} label={t('tocLabel')} />
              )}

              {parsed.intro.length > 0 && (
                <div className="mt-8">
                  <TourBlocks blocks={parsed.intro} accent={entry.accent} />
                </div>
              )}

              {fishingClasses && (
                <>
                  <SectionTitle id="class">{t('classPick')}</SectionTitle>
                  <TourClassCards classes={fishingClasses} classPrices={booking.classPrices} />
                </>
              )}

              {options.length > 0 && (
                <>
                  <SectionTitle id="option">{t('optionPick')}</SectionTitle>
                  <TourOptionCards options={options} />
                </>
              )}

              {showDetail && steps.length > 0 && (
                <>
                  <SectionTitle id="steps">{t('stepsTitle')}</SectionTitle>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-[#061522]/60 px-4 py-5 backdrop-blur-md sm:px-6">
                    <TourSteps steps={steps} accent={entry.accent} />
                  </div>
                </>
              )}

              {showDetail && included.length > 0 && (
                <>
                  <SectionTitle id="included">{t('includesTitle')}</SectionTitle>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {included.map((it) => (
                      <li
                        key={it}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#061522]/60 px-4 py-3.5 text-[15px] text-white/90 backdrop-blur-md"
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                          style={{ backgroundColor: `${entry.accent}26`, color: entry.accent }}
                        >
                          <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                        </span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {mainSections.map((s, i) => (
                <section key={`${i}-${s.title}`}>
                  <SectionTitle id={`s${i}`}>{s.title}</SectionTitle>
                  <div className="mt-5">
                    <TourBlocks blocks={s.blocks} accent={entry.accent} />
                  </div>
                </section>
              ))}

              {rules.length > 0 && (
                <>
                  <SectionTitle id="rules">{t('rulesTitle')}</SectionTitle>
                  <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#061522]/60 backdrop-blur-md">
                    {rules.map((r, i) => (
                      <details key={`${i}-${r.title}`} open={i === 0} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-bold text-white [&::-webkit-details-marker]:hidden">
                          {r.title}
                          <Icon name="chevron" className="h-5 w-5 shrink-0 text-white/60 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-5 pb-5">
                          <TourBlocks blocks={r.blocks} accent={entry.accent} />
                        </div>
                      </details>
                    ))}
                  </div>
                </>
              )}

              {!showDetail && (
                <p className="mt-8 text-[15px] leading-relaxed text-white/70">{t('preparing')}</p>
              )}
            </div>

            <aside aria-label={t('bookAside')} className="lg:sticky lg:top-28 lg:self-start">
              <BookingCard info={booking} />
            </aside>
          </div>
        </Container>
        <MobileBookBar info={booking} />
      </TourBookingProvider>
    </article>
  );
}
