import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getProductsByCategories } from '@/lib/content';
import Container from '@/components/Container';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('diving') };
}

export default async function DivingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations('nav');
  const tProducts = await getTranslations('products');
  // 다이빙 = 체험·펀·그룹 (자격증은 PADI 교육으로 분리)
  const products = getProductsByCategories(locale as Locale, ['experience', 'fun', 'freediving', 'group']);

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <h1 className="font-serif text-3xl font-normal text-ink sm:text-4xl">
          {tNav('diving')}
        </h1>
        <p className="mt-3 font-mono text-sm tracking-[0.02em] text-muted">
          {tProducts('sectionSubtitle')}
        </p>

        {products.length === 0 ? (
          <p className="mt-8 text-muted">{tProducts('empty')}</p>
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
