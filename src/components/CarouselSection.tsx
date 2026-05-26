'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Container from './Container';
import Reveal from './Reveal';

const GAP = 12; // gap-3

/**
 * 캐러셀 섹션 — 전체 폭 가로 스크롤. 화살표 클릭 시 카드 1장씩 이동(snap).
 * align: 'center' = 제목·설명 중앙(투어 상품) + 데스크탑에서 가운데 3장 온전 + 양옆 2장 잘림(레퍼런스 Must-Do),
 *        'left' = 제목 좌 + 설명 우 2단(시그니처) + 첫 카드부터 노출.
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

  // center(투어): 데스크탑에서 가운데 3장 온전 + 양옆 2장 잘림이 되도록 초기 스크롤 위치 계산.
  // left(시그니처)는 첫 카드부터 노출하므로 건드리지 않는다.
  useEffect(() => {
    if (align !== 'center') return;
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      // 데스크탑(가운데 3장 배치 가능)에서만 양옆 peek, 그 외엔 첫 카드 정렬
      if (window.innerWidth < 1024) {
        el.scrollLeft = 0;
        return;
      }
      const cardW = first.getBoundingClientRect().width;
      const leftPeek = Math.max(0, (el.clientWidth - 3 * cardW - 2 * GAP) / 2);
      el.scrollLeft = cardW + GAP - leftPeek;
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [align]);

  // 화살표: 카드 1장(+gap)씩 정확히 이동
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width + GAP : el.clientWidth * 0.3;
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
          <Reveal className="grid gap-5 lg:grid-cols-2 lg:items-center lg:gap-12">
            <h2 className="font-serif text-4xl leading-tight text-white sm:text-5xl">
              {title}
            </h2>
            {intro && (
              <p className="text-base leading-relaxed text-white/60 lg:text-lg">{intro}</p>
            )}
          </Reveal>
        ) : (
          <Reveal>
            <h2 className="text-center font-serif text-4xl text-white sm:text-5xl">{title}</h2>
            {intro && (
              <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-white/60">
                {intro}
              </p>
            )}
          </Reveal>
        )}
      </Container>

      <Reveal
        delay={0.12}
        className={`relative mt-10 ${align === 'left' ? 'sm:mt-[150px]' : 'sm:mt-[110px]'}`}
      >
        <button type="button" aria-label="이전" onClick={() => scroll(-1)} className={`${arrow} left-3`}>
          ‹
        </button>
        <button type="button" aria-label="다음" onClick={() => scroll(1)} className={`${arrow} right-3`}>
          ›
        </button>

        {/* left=mandatory snap+첫 카드 들여쓰기. center=snap 강제 없음(양옆 peek 초기 스크롤 유지) + 데스크탑 화면 끝까지 */}
        <div
          ref={ref}
          className={`no-scrollbar flex gap-3 overflow-x-auto pb-2 ${
            align === 'left'
              ? 'snap-x snap-mandatory px-[5vw] scroll-pl-[5vw]'
              : 'px-5 lg:px-0'
          }`}
        >
          {children}
        </div>
      </Reveal>
    </section>
  );
}
