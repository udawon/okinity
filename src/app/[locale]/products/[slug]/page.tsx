import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, routing, type Locale } from '@/i18n/routing';
import {
  getProduct,
  getAllProductSlugs,
  formatPriceKRW
} from '@/lib/content';
import Container from '@/components/Container';
import Markdown from '@/components/Markdown';

// 로케일 × slug 정적 생성
export function generateStaticParams() {
  const slugs = getAllProductSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProduct(locale as Locale, slug);
  if (!product) return {};

  return {
    title: product.title,
    description: product.summary,
    // 번역 폴백된 페이지는 검색에 색인하지 않음 (설계의 i18n 폴백 정책)
    robots: product.fellBackToDefault ? { index: false, follow: true } : undefined,
    openGraph: {
      title: product.title,
      description: product.summary,
      images: [{ url: product.heroImage }]
    }
  };
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProduct(locale as Locale, slug);
  if (!product) notFound();

  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('nav');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <article className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        {product.fellBackToDefault && (
          <p className="mb-6 rounded-button bg-brand-light px-4 py-3 text-sm text-brand-dark">
            {tCommon('translationPending')}
          </p>
        )}

        <span className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
          {t(`category.${product.category}`)}
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
          {product.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{product.summary}</p>

        <div
          className="mt-8 aspect-[16/9] w-full rounded-card bg-brand-light bg-cover bg-center"
          style={{ backgroundImage: `url(${product.heroImage})` }}
          role="img"
          aria-label={product.title}
        />

        <div className="mt-8 flex flex-wrap gap-6 border-y border-line py-5 text-sm">
          <div>
            <span className="block text-muted">{t('priceLabel')}</span>
            <span className="text-lg font-bold text-ink">
              {price ? t('priceFrom', { price }) : t('priceOnRequest')}
            </span>
          </div>
          {product.durationHours != null && (
            <div>
              <span className="block text-muted">{t('durationLabel')}</span>
              <span className="text-lg font-bold text-ink">
                {t('durationHours', { hours: product.durationHours })}
              </span>
            </div>
          )}
        </div>

        {product.includes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">{t('includesTitle')}</h2>
            <ul className="mt-3 space-y-2">
              {product.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-ink">
                  <span className="mt-1 text-brand">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.body && (
          <div className="mt-8">
            <Markdown>{product.body}</Markdown>
          </div>
        )}

        <div className="mt-10">
          <Link
            href={`/contact?product=${product.slug}`}
            className="inline-block rounded-button bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {tNav('contact')}
          </Link>
        </div>
      </Container>
    </article>
  );
}
