import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getAllProducts } from '@/lib/content';
import Container from '@/components/Container';
import InquiryForm from '@/components/InquiryForm';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('contact');
  const products = getAllProducts(locale as Locale).map((p) => ({
    slug: p.slug,
    title: p.title
  }));

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('subtitle')}</p>
        <div className="mt-8">
          <InquiryForm products={products} />
        </div>
      </Container>
    </section>
  );
}
