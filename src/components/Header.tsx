import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { site } from '@/config/site.config';
import Container from './Container';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';
import HeaderShell from './HeaderShell';

const NAV = [
  { href: '/about', key: 'about' },
  { href: '/diving', key: 'diving' },
  { href: '/padi', key: 'padi' },
  { href: '/schedule', key: 'schedule' },
  { href: '/gallery', key: 'gallery' }
] as const;

export default async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('nav');

  return (
    <HeaderShell>
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[111px]">
        <Link href="/" aria-label={site.name} className="inline-flex items-center">
          <Image
            src="/brand/logo-white.png"
            alt={site.name}
            width={819}
            height={235}
            priority
            className="h-8 w-auto sm:h-11"
          />
        </Link>

        {/* 데스크탑 내비 */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 lg:flex">
          {NAV.map((it) => (
            <Link key={it.key} href={it.href} className="transition-colors hover:text-white">
              {t(it.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <LocaleSwitcher current={locale} />
          </div>
          <Link
            href="/contact"
            className="hidden rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-dark sm:inline-block"
          >
            {t('contact')}
          </Link>
          <MobileNav current={locale} />
        </div>
      </Container>
    </HeaderShell>
  );
}
