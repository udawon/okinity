import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseNoticeItems, publishedNotices, excerptOf } from '@/lib/notice';
import { localeAlternates } from '@/lib/seo';
import Container from '@/components/Container';

export const dynamic = 'force-dynamic';

function formatDate(date: string, locale: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    d
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notice' });
  return {
    title: t('title'),
    description: t('intro'),
    alternates: localeAlternates(locale, '/notice')
  };
}

export default async function NoticeListPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('notice');

  const value = await getSiteContent(CONTENT_KEYS.notice);
  const posts = publishedNotices(parseNoticeItems(value?.items));

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-3xl text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-3 max-w-xl text-white/60">{t('intro')}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-white/50">{t('empty')}</p>
        ) : (
          <ul className="mt-10 divide-y divide-white/10 border-t border-white/10">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/notice/${p.id}`}
                  className="group block py-6 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2 text-sm text-[#5fc6ef]">
                    {p.pinned && (
                      <span className="rounded-full bg-[#5fc6ef]/15 px-2 py-0.5 text-xs font-semibold">
                        고정
                      </span>
                    )}
                    <span>{formatDate(p.date, locale)}</span>
                  </div>
                  <h2 className="mt-1.5 font-serif text-xl text-white transition-colors group-hover:text-[#a6e0fb] sm:text-2xl">
                    {p.title || '(제목 없음)'}
                  </h2>
                  {excerptOf(p) && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">
                      {excerptOf(p)}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
