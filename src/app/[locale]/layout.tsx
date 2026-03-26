import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'OKINITY — 오키나와 프리미엄 요트 경험',
  description:
    '오키나와 프리미엄 요트 투어. 프라이빗 크루즈, VIP 비즈니스, 불꽃축제 관람, 프로포즈 이벤트. 沖縄プレミアムヨット体験。',
  openGraph: {
    title: 'OKINITY — 오키나와 프리미엄 요트 경험',
    description:
      '바다 위에서 특별한 순간을. 프라이빗 크루즈, VIP 비즈니스, 불꽃축제 관람, 프로포즈 이벤트.',
    url: 'https://okinity.vercel.app',
    siteName: 'OKINITY',
    images: [
      {
        url: 'https://okinity.vercel.app/images/og.jpg',
        width: 1200,
        height: 630,
        alt: 'OKINITY — 오키나와 프리미엄 요트 경험',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OKINITY — 오키나와 프리미엄 요트 경험',
    description:
      '바다 위에서 특별한 순간을. 프라이빗 크루즈, VIP 비즈니스, 불꽃축제 관람, 프로포즈 이벤트.',
    images: ['https://okinity.vercel.app/images/og.jpg'],
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ko' | 'ja' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
