import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseBlogItems, publishedSorted } from '@/lib/blog';
import { localeAlternates } from '@/lib/seo';
import Container from '@/components/Container';
import BlogCard from '@/components/BlogCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('sectionTitle'),
    description: t('sectionIntro'),
    alternates: localeAlternates(locale, '/blog')
  };
}

export default async function BlogListPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('blog');

  const value = await getSiteContent(CONTENT_KEYS.blog);
  const posts = publishedSorted(parseBlogItems(value?.items));

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <h1 className="font-serif text-3xl text-white sm:text-4xl">{t('sectionTitle')}</h1>
        <p className="mt-3 max-w-xl text-white/60">{t('sectionIntro')}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-white/50">{t('empty')}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogCard key={p.id} post={p} locale={locale as Locale} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
