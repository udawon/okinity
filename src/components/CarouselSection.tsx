'use client';

import { useRef, type ReactNode } from 'react';
import Container from './Container';

/**
 * 캐러셀 섹션 — 전체 폭 가로 스크롤. 첫 카드는 왼쪽 정렬(온전 노출),
 * 오른쪽 끝에서 다음 카드가 잘려 peek가 생긴다. 화살표 클릭 시 카드 1장씩 이동(snap).
 * align: 'center' = 제목·설명 중앙(투어 상품), 'left' = 제목 좌 + 설명 우 2단(시그니처).
 */
export default function CarouselSection({
  title,
  intro,
  align = 'center',
  children
}: {
  title: string;
  intro?: string;
  align?: 'center' | 'left';
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // 화살표: 카드 1장(+gap)씩 정확히 이동
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = 12;
    const step = first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.3;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const arrow =
    'absolute top-[40%] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-ink shadow-card backdrop-blur transition-colors hover:bg-white sm:flex';

  return (
    <section
      className={
        align === 'left'
          ? 'py-20 sm:py-[195px]' // 시그니처: sunsiyam Signature 상하 195px 대칭
          : 'pt-16 pb-20 sm:pt-[155px] sm:pb-[183px]' // 투어: sunsiyam Must-Do 상단 155 / 하단 183
      }
    >
      <Container>
        {align === 'left' ? (
          <div className="grid gap-5 lg:grid-cols-2 lg:items-center lg:gap-12">
            <h2 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
              {title}
            </h2>
            {intro && (
              <p className="text-base leading-relaxed text-muted lg:text-lg">{intro}</p>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-center font-serif text-4xl text-ink sm:text-5xl">{title}</h2>
            {intro && (
              <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-muted">
                {intro}
              </p>
            )}
          </>
        )}
      </Container>

      <div className={`relative mt-10 ${align === 'left' ? 'sm:mt-[150px]' : 'sm:mt-[110px]'}`}>
        <button type="button" aria-label="이전" onClick={() => scroll(-1)} className={`${arrow} left-3`}>
          ‹
        </button>
        <button type="button" aria-label="다음" onClick={() => scroll(1)} className={`${arrow} right-3`}>
          ›
        </button>

        {/* 좌우 peek + 카드 1장 단위 snap */}
        <div
          ref={ref}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[5vw] pb-2 scroll-pl-[5vw]"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
