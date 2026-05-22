'use client';

import { useRef, type ReactNode } from 'react';
import Container from './Container';

/**
 * 캐러셀 섹션 — 좌측 제목(+소개), 우측 상단 화살표, 아래 가로 스크롤 카드 줄.
 * (리조트 사이트의 테마별 카드 캐러셀 패턴) 화살표로 한 화면씩 스크롤.
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
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const arrow =
    'flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:border-brand hover:text-brand-dark';

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl text-ink sm:text-4xl">{title}</h2>
            {intro && <p className="mt-2 max-w-xl text-muted">{intro}</p>}
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button type="button" aria-label="이전" onClick={() => scroll(-1)} className={arrow}>
              ‹
            </button>
            <button type="button" aria-label="다음" onClick={() => scroll(1)} className={arrow}>
              ›
            </button>
          </div>
        </div>

        <div
          ref={ref}
          className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:gap-5 lg:mx-0 lg:px-0"
        >
          {children}
        </div>
      </Container>
    </section>
  );
}
