import type { ReactNode } from 'react';

/**
 * 가로 스크롤 카루셀 (CSS scroll-snap, JS 불필요).
 * 카드가 옆으로 흐르고 다음 카드가 살짝 보이는(peek) 리조트 사이트 패턴.
 * 자식은 각자 너비를 가진 snap 아이템으로 전달한다.
 */
export default function Carousel({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:gap-5 lg:mx-0 lg:px-0">
      {children}
    </div>
  );
}

/** 카루셀 아이템 래퍼 — 화면 비율 기반(전체 폭 캐러셀). 데스크탑 2.5장 노출, 가장자리 bleed. */
export function CarouselItem({ children }: { children: ReactNode }) {
  return (
    <div className="w-[80vw] shrink-0 snap-start sm:w-[52vw] lg:w-[36vw]">{children}</div>
  );
}
