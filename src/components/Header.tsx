import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { site } from '@/config/site.config';
import Container from './Container';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';

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
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-mono text-base font-bold uppercase tracking-[0.12em] text-ink"
        >
          {site.name}
        </Link>

        {/* 데스크탑 내비 */}
        <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-[0.1em] text-muted lg:flex">
          {NAV.map((it) => (
            <Link key={it.key} href={it.href} className="hover:text-ink">
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
            className="hidden bg-brand px-4 py-2 font-mono text-xs uppercase tracking-[0.08em] text-brand-contrast transition-colors hover:bg-brand-dark sm:inline-block"
          >
            {t('contact')}
          </Link>
          <MobileNav current={locale} />
        </div>
      </Container>
    </header>
  );
}
