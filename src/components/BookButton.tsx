'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';

/**
 * 상시 노출 예약 버튼 — 모바일 전용 우측 하단 고정 알약(flow feature).
 * 데스크탑은 헤더가 고정 노출되고 예약 버튼이 항상 보이므로 별도 플로팅 탭을 두지 않는다.
 * 예약 페이지(/reserve)에서는 이미 예약 화면이라 중복·폼 가림 방지를 위해 숨긴다.
 */
export default function BookButton() {
  const t = useTranslations('nav');
  const pathname = usePathname(); // 로케일 프리픽스 제외 경로

  if (pathname === '/reserve') return null;

  return (
    // 모바일: 우측 하단 고정 알약(헤더 예약 버튼은 햄버거 메뉴 안에 있어 상시 노출 필요)
    <Link
      href="/reserve"
      className="fixed bottom-5 right-5 z-50 rounded-button bg-brand px-6 py-3 text-sm font-semibold text-brand-contrast shadow-hover transition-colors hover:bg-brand-dark lg:hidden"
    >
      {t('contact')}
    </Link>
  );
}
