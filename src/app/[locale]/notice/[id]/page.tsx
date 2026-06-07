import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseNoticeItems } from '@/lib/notice';
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

async function loadPost(id: string) {
  const value = await getSiteContent(CONTENT_KEYS.notice);
  return parseNoticeItems(value?.items).find((p) => p.id === id && p.published) ?? null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'notice' });
  const post = await loadPost(id);
  return { title: post?.title || t('title') };
}

export default async function NoticePostPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('notice');

  const post = await loadPost(id);
  if (!post) notFound();

  return (
    <article className="py-16 sm:py-24">
      <Container className="max-w-2xl">
        <Link href="/notice" className="text-sm text-white/55 transition-colors hover:text-white">
          {t('back')}
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-2 text-sm text-[#5fc6ef]">
            {post.pinned && (
              <span className="rounded-full bg-[#5fc6ef]/15 px-2 py-0.5 text-xs font-semibold">
                고정
              </span>
            )}
            {post.date && <span>{formatDate(post.date, locale)}</span>}
          </div>
          <h1 className="mt-2 text-balance font-serif text-3xl leading-tight text-white sm:text-4xl">
            {post.title || '(제목 없음)'}
          </h1>
        </header>

        <div className="mt-10 whitespace-pre-wrap text-base leading-relaxed text-white/85">
          {post.body}
        </div>
      </Container>
    </article>
  );
}
