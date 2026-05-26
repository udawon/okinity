import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import Container from '@/components/Container';
import ScheduleCalendar from '@/components/ScheduleCalendar';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'schedule' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function SchedulePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('schedule');
  const tNav = await getTranslations('nav');
  const items = getSchedule();

  const statusLabel: Record<ScheduleItem['status'], string> = {
    available: t('statusAvailable'),
    full: t('statusFull'),
    closed: t('statusClosed')
  };

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-3xl font-normal text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{t('subtitle')}</p>

        <div className="mt-10 rounded-card border border-white/10 bg-[#081a24]/85 p-5 shadow-card backdrop-blur-md sm:p-7">
          <ScheduleCalendar
            items={items}
            locale={locale}
            statusLabel={statusLabel}
            emptyLabel={t('empty')}
          />
        </div>

        <Link
          href="/contact"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#06151d] transition hover:bg-white/90"
        >
          {tNav('contact')}
          <span aria-hidden>→</span>
        </Link>
      </Container>
    </section>
  );
}
