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

/**
 * 카루셀 아이템 래퍼.
 * 기본(투어 상품): 화면 비율 ~28vw — 레퍼런스 Must-Do처럼 화면 따라 커짐.
 * fixed(시그니처): 고정 340px — 레퍼런스 Signature는 폭 고정이라 넓은 화면에선 더 많이 노출.
 */
export function CarouselItem({
  children,
  fixed = false
}: {
  children: ReactNode;
  fixed?: boolean;
}) {
  const w = fixed ? 'w-[78vw] sm:w-[340px]' : 'w-[78vw] sm:w-[46vw] lg:w-[28vw]';
  return <div className={`${w} shrink-0 snap-start`}>{children}</div>;
}
