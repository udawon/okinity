import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { site } from '@/config/site.config';
import Container from './Container';
import LocaleSwitcher from './LocaleSwitcher';
import MobileNav from './MobileNav';
import DesktopNav from './DesktopNav';
import HeaderShell from './HeaderShell';

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

        {/* 데스크탑 내비 (3 카테고리 드롭다운) */}
        <DesktopNav />

        <div className="flex items-center gap-3">
          <div className="hidden xl:block">
            <LocaleSwitcher current={locale} />
          </div>
          <Link
            href="/reserve"
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
