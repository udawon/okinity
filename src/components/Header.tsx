import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { site } from '@/config/site.config';
import Container from './Container';
import LocaleSwitcher from './LocaleSwitcher';

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

        <nav className="hidden items-center gap-7 font-mono text-xs uppercase tracking-[0.1em] text-muted md:flex">
          <Link href="/products" className="hover:text-ink">
            {t('products')}
          </Link>
          <Link href="/instructor" className="hover:text-ink">
            {t('instructor')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <Link
            href="/contact"
            className="bg-brand px-4 py-2 font-mono text-xs uppercase tracking-[0.08em] text-brand-contrast transition-colors hover:bg-brand-dark"
          >
            {t('contact')}
          </Link>
        </div>
      </Container>
    </header>
  );
}
