import type { Metadata } from 'next';
import { Playfair_Display, Noto_Serif_KR, Noto_Sans_KR } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { site } from '@/config/site.config';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookButton from '@/components/BookButton';
import OceanBackground from '@/components/OceanBackground';
import '../globals.css';

// next/font — self-host + subset + preload. CDN @import(render-blocking) 대체.
// 한글(Noto KR)은 글리프가 커서 preload는 끄고 display:swap으로 깜빡임만 짧게.
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-playfair',
  display: 'swap'
});
const notoSerifKR = Noto_Serif_KR({
  weight: ['400', '500', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
  preload: false
});
const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
  preload: false
});
const fontVars = `${playfair.variable} ${notoSerifKR.variable} ${notoSansKR.variable}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — ${t('eyebrow')}`,
      template: `%s | ${site.name}`
    },
    description: t('subtitle'),
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale,
      images: [{ url: site.defaultOgImage }]
    },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();

  // 정적 렌더링을 위해 요청 로케일 고정
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={fontVars}>
      <body className="min-h-dvh font-sans text-white antialiased">
        <OceanBackground />
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale as Locale} />
          <main>{children}</main>
          <Footer />
          <BookButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
