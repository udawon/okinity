import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import ReservationForm from '@/components/ReservationForm';

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

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-xl">
        <h1 className="font-serif text-3xl font-normal text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-white/70">{t('subtitle')}</p>
        <div className="mt-8 overflow-hidden rounded-card border border-white/10 bg-gradient-to-b from-[#0e3848]/85 to-[#06151d]/85 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <ReservationForm />
        </div>
      </Container>
    </section>
  );
}
