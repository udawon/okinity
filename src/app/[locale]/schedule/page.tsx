import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import Container from '@/components/Container';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'schedule' });
  return { title: t('title'), description: t('subtitle') };
}

const STATUS_STYLE: Record<ScheduleItem['status'], string> = {
  available: 'text-brand',
  full: 'text-muted',
  closed: 'text-muted line-through'
};

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
    <section className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-3xl font-normal text-ink sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 font-mono text-sm tracking-[0.02em] text-muted">
          {t('subtitle')}
        </p>

        {items.length === 0 ? (
          <p className="mt-8 text-muted">{t('empty')}</p>
        ) : (
          <table className="mt-8 w-full border border-line text-left font-mono text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.06em]">
                  {t('colDate')}
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.06em]">
                  {t('colProgram')}
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.06em]">
                  {t('colStatus')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-ink">{it.date}</td>
                  <td className="px-4 py-3 text-ink">{it.program}</td>
                  <td className={`px-4 py-3 font-semibold ${STATUS_STYLE[it.status]}`}>
                    {statusLabel[it.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Link
          href="/contact"
          className="mt-8 inline-block bg-brand px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] text-brand-contrast transition-colors hover:bg-brand-dark"
        >
          {tNav('contact')}
        </Link>
      </Container>
    </section>
  );
}
