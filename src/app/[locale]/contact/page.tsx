import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import InquiryForm from '@/components/InquiryForm';
import { ACTIVITIES } from '@/components/ocean-home-data';

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
  // 관심 투어 드롭다운 — 새 투어 카테고리의 하위 투어로 구성
  const products = ACTIVITIES.flatMap((a) =>
    a.tours.map((tour) => ({ slug: tour.slug, title: `${a.title} · ${tour.name}` }))
  );

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-2xl">
        <h1 className="font-serif text-3xl font-normal text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-white/70">{t('subtitle')}</p>
        <div className="mt-8">
          <InquiryForm products={products} />
        </div>
      </Container>
    </section>
  );
}
