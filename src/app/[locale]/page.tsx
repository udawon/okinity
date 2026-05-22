import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { getAllProducts, getInstructor, getReviews } from '@/lib/content';
import Container from '@/components/Container';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import ReviewList from '@/components/ReviewList';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('products');
  const tInstructor = await getTranslations('instructor');
  const products = getAllProducts(locale as Locale);
  const instructor = getInstructor(locale as Locale);
  const reviews = getReviews(locale as Locale);

  return (
    <>
      <Hero />

      {/* 상품 4종 카드 */}
      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            {t('sectionTitle')}
          </h2>
          <p className="mt-2 text-muted">{t('sectionSubtitle')}</p>

          {products.length === 0 ? (
            <p className="mt-8 text-muted">{t('empty')}</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 강사 소개 요약 (신뢰 앵커) */}
      {instructor && (
        <section className="bg-surface py-16">
          <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div
              className="h-40 w-40 shrink-0 rounded-card bg-brand-light bg-cover bg-center"
              style={{ backgroundImage: `url(${instructor.photo})` }}
              role="img"
              aria-label={instructor.name}
            />
            <div>
              <h2 className="text-2xl font-bold text-ink">
                {tInstructor('sectionTitle')}
              </h2>
              <p className="mt-2 text-lg font-semibold text-brand-dark">
                {instructor.name}
              </p>
              <p className="mt-1 text-muted">{instructor.headline}</p>
              <Link
                href="/instructor"
                className="mt-4 inline-block rounded-button border border-line px-5 py-2 text-sm font-semibold text-ink hover:border-brand"
              >
                {tInstructor('readMore')}
              </Link>
            </div>
          </Container>
        </section>
      )}

      <ReviewList reviews={reviews} />
    </>
  );
}
