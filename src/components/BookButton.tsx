import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

/**
 * 상시 노출 예약 버튼 — 모바일 전용 우측 하단 고정 알약(flow feature).
 * 데스크탑은 헤더가 고정 노출되고 예약 버튼이 항상 보이므로 별도 플로팅 탭을 두지 않는다.
 */
export default async function BookButton() {
  const t = await getTranslations('nav');

  return (
    // 모바일: 우측 하단 고정 알약(헤더 예약 버튼은 햄버거 메뉴 안에 있어 상시 노출 필요)
    <Link
      href="/contact"
      className="fixed bottom-5 right-5 z-50 rounded-button bg-brand px-6 py-3 text-sm font-semibold text-brand-contrast shadow-hover transition-colors hover:bg-brand-dark lg:hidden"
    >
      {t('contact')}
    </Link>
  );
}
