'use client';

import { useRef, type ReactNode } from 'react';
import Container from './Container';

/**
 * 캐러셀 섹션 — 전체 폭(width 100%) 가로 스크롤. 카드가 화면 가장자리까지 꽉 차고
 * 좌우 끝에서 잘리며 흐른다. 화살표는 좌우 가장자리·세로 중앙에 오버레이.
 * (Sun Siyam "Must-Do" 캐러셀 패턴)
 */
export default function CarouselSection({
  title,
  intro,
  children
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const arrow =
    'absolute top-[38%] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-2xl text-ink shadow-card backdrop-blur transition-colors hover:bg-white sm:flex';

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">{title}</h2>
        {intro && (
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">{intro}</p>
        )}
      </Container>

      <div className="relative mt-10">
        <button type="button" aria-label="이전" onClick={() => scroll(-1)} className={`${arrow} left-3`}>
          ‹
        </button>
        <button type="button" aria-label="다음" onClick={() => scroll(1)} className={`${arrow} right-3`}>
          ›
        </button>

        {/* 전체 폭 스크롤러 — 카드가 가장자리까지 흐름 */}
        <div
          ref={ref}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:gap-6 sm:px-6 lg:px-8"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
