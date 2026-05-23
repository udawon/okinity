import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

/**
 * 상시 노출 예약(BOOK) 버튼 — 사이트 어디서나 떠 있는 예약 진입(flow feature).
 * 데스크탑: 우측 가장자리 세로 탭 / 모바일: 우측 하단 고정 알약.
 */
export default async function BookButton() {
  const t = await getTranslations('nav');

  return (
    <>
      {/* 데스크탑: 우측 가장자리 세로 'BOOK' 탭 */}
      <Link
        href="/contact"
        className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 origin-right rounded-l-button bg-brand px-3 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-contrast shadow-hover transition-colors hover:bg-brand-dark lg:block [writing-mode:vertical-rl]"
        aria-label={t('contact')}
      >
        BOOK
      </Link>
      {/* 모바일: 우측 하단 고정 알약 */}
      <Link
        href="/contact"
        className="fixed bottom-5 right-5 z-50 rounded-button bg-brand px-6 py-3 text-sm font-semibold text-brand-contrast shadow-hover transition-colors hover:bg-brand-dark lg:hidden"
      >
        {t('contact')}
      </Link>
    </>
  );
}
