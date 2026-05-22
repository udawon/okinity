import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getAllProducts } from '@/lib/content';
import Container from '@/components/Container';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });
  return { title: t('sectionTitle'), description: t('sectionSubtitle') };
}

export default async function ProductsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('products');
  const products = getAllProducts(locale as Locale);

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
          {t('sectionTitle')}
        </h1>
        <p className="mt-2 text-muted">{t('sectionSubtitle')}</p>

        {products.length === 0 ? (
          <p className="mt-8 text-muted">{t('empty')}</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
