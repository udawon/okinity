'use client';

import { useEffect } from 'react';

/**
 * Hero 스크롤 스냅 (trickyknot 방식) — Hero 구간에서 한 번 스크롤(휠/스와이프)하면
 * 다음 섹션 상단으로 부드럽게 활강한다. 다음 섹션 상단 근처에서 위로 올리면 Hero로 복귀.
 *
 * GSAP 없이 rAF + easeInOutCubic로 구현. 홈에서만 마운트한다(렌더 null).
 * - 애니메이션 중에는 입력을 잠가(preventDefault) 트랙패드 관성과 충돌하지 않게 한다.
 * - 첫 섹션이 거의 풀뷰포트(Hero)일 때만 작동 — 레이아웃이 바뀌어도 오작동 방지.
 * - prefers-reduced-motion이면 네이티브 스크롤 유지.
 */
export default function HeroSnap() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const main = document.querySelector('main');
    if (!main) return;
    const sections = main.querySelectorAll(':scope > section');
    if (sections.length < 2) return;
    const next = sections[1] as HTMLElement;

    let animating = false;
    let raf = 0;

    const topOf = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
    // 첫 섹션이 Hero(거의 풀뷰포트)일 때만 스냅 작동
    const heroLike = () => topOf(next) > window.innerHeight * 0.8;
    const inHeroZone = () => window.scrollY < topOf(next) - 4;
    const nearNextTop = () => Math.abs(window.scrollY - topOf(next)) < window.innerHeight * 0.5;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateTo = (target: number, dur = 750) => {
      animating = true;
      const start = window.scrollY;
      const dist = target - start;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, start + dist * easeInOutCubic(p));
        if (p < 1) raf = requestAnimationFrame(step);
        else animating = false;
      };
      raf = requestAnimationFrame(step);
    };

    const handle = (dir: 1 | -1, e: Event) => {
      if (animating) {
        e.preventDefault();
        return;
      }
      if (!heroLike()) return;
      if (dir > 0 && inHeroZone()) {
        e.preventDefault();
        animateTo(topOf(next));
      } else if (dir < 0 && !inHeroZone() && nearNextTop() && window.scrollY > 0) {
        e.preventDefault();
        animateTo(0);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      handle(e.deltaY > 0 ? 1 : -1, e);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchStartY - e.touches[0].clientY; // 위로 스와이프(콘텐츠 하강) = 양수
      if (Math.abs(dy) < 24) return;
      handle(dy > 0 ? 1 : -1, e);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return null;
}
