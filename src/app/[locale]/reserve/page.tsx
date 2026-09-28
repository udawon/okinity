import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import { normalizeScheduleItems } from '@/lib/schedule-range';
import { getSiteContent, getSiteContentMap, localizedContentKey, CONTENT_KEYS } from '@/lib/site-content';
import { parseTourTimes } from '@/lib/tour-times';
import { TOUR_CATALOG, bookableOptions, resolveTourDetail } from '@/lib/tour';
import type { ReserveOption } from '@/lib/tour-options';
import { localeAlternates } from '@/lib/seo';
import Container from '@/components/Container';
import ReservePlanner from '@/components/ReservePlanner';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reservation' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale, '/reserve')
  };
}

export default async function ReservePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('schedule');
  const tr = await getTranslations('reservation');

  // 어드민이 지정한 일정/휴무만(확정 예약은 공개 일정표에 연동하지 않음).
  // 과거 저장분(구 status 체계)은 normalize에서 현재 구분으로 변환된다.
  const override = await getSiteContent(CONTENT_KEYS.schedule);
  const overrideItems = (override as { items?: unknown } | null)?.items;
  const items: ScheduleItem[] = Array.isArray(overrideItems)
    ? normalizeScheduleItems(overrideItems)
    : getSchedule();

  // 투어별 가능 시간대(어드민 설정) — 예약 폼의 시간대 선택지.
  const tourTimes = parseTourTimes(await getSiteContent(CONTENT_KEYS.tourTimes));

  // 투어별 선택 옵션(예: 스노클링 일반/프라이빗) — 예약 폼 옵션 칸. 기록용 이름은 한국어 저장본.
  const tourKeys = TOUR_CATALOG.flatMap((t) => {
    const k = CONTENT_KEYS.tour(t.slug);
    return [k, localizedContentKey(k, locale)];
  });
  const tourMap = await getSiteContentMap(Array.from(new Set(tourKeys)));
  const tourOptions: Record<string, ReserveOption[]> = {};
  for (const t of TOUR_CATALOG) {
    const k = CONTENT_KEYS.tour(t.slug);
    const base = resolveTourDetail(t.slug, tourMap[k] ?? null);
    const local = resolveTourDetail(t.slug, tourMap[localizedContentKey(k, locale)] ?? tourMap[k] ?? null);
    const opts = bookableOptions(t.slug, base, local);
    if (!opts.length) continue;
    tourOptions[t.slug] = opts.map((o) => ({
      key: o.key,
      label: o.name,
      productLabel: base.options.find((b) => b.key === o.key)?.name.trim() || o.name,
      pricePerPerson: o.pricePerPerson,
      minPeople: o.minPeople
    }));
  }

  const statusLabel: Record<ScheduleItem['status'], string> = {
    tour: t('kindTour'),
    special: t('kindSpecial'),
    blocked: t('kindBlocked')
  };

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <h1 className="font-serif text-3xl font-normal text-white sm:text-4xl">{tr('heading')}</h1>
        <p className="mt-2 text-white/70">{tr('intro')}</p>
        <div className="mt-8">
          <ReservePlanner
            items={items}
            locale={locale}
            statusLabel={statusLabel}
            tourTimes={tourTimes}
            tourOptions={tourOptions}
          />
        </div>
      </Container>
    </section>
  );
}
