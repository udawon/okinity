import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import Container from '@/components/Container';
import ReservePlanner from '@/components/ReservePlanner';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return { title: '예약', description: '원하는 날짜를 선택해 바로 예약 문의를 보내세요.' };
}

export default async function ReservePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('schedule');

  // 어드민이 지정한 일정/휴무만(확정 예약은 공개 일정표에 연동하지 않음).
  const override = await getSiteContent(CONTENT_KEYS.schedule);
  const overrideItems = (override as { items?: unknown } | null)?.items;
  const items: ScheduleItem[] = (
    Array.isArray(overrideItems) ? (overrideItems as ScheduleItem[]) : getSchedule()
  )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const statusLabel: Record<ScheduleItem['status'], string> = {
    available: t('statusAvailable'),
    full: t('statusFull'),
    closed: t('statusClosed'),
    booked: t('statusBooked'),
    morning: t('statusMorning'),
    afternoon: t('statusAfternoon')
  };

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-container">
        <h1 className="font-serif text-3xl font-normal text-white sm:text-4xl">예약</h1>
        <p className="mt-2 text-white/70">
          달력에서 원하는 날짜를 선택해 바로 예약 문의를 보내세요. 휴무를 제외한 날짜는 모두 가능합니다.
        </p>
        <div className="mt-8">
          <ReservePlanner
            items={items}
            locale={locale}
            statusLabel={statusLabel}
            emptyLabel={t('empty')}
          />
        </div>
      </Container>
    </section>
  );
}
