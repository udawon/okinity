'use client';

import { useEffect } from 'react';

/**
 * 홈 섹션 스냅.
 * - 데스크탑(휠): 휠을 가로채 진행 방향 다음 섹션으로 직접 활강(아래 JS).
 * - 모바일(터치): JS로 터치를 가로채면 불안정하므로, CSS scroll-snap(globals.css의
 *   pointer:coarse)으로 처리. 거기서 섹션을 한 화면 높이로 만들어 mandatory 스냅이
 *   확실히 걸리게 한다. 본 컴포넌트는 그 CSS 범위를 홈으로 한정하는 html.snap-page
 *   클래스를 토글한다(홈에서만 마운트).
 * - prefers-reduced-motion이면 휠 스냅 비활성.
 */
export default function ScrollSnap() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('snap-page'); // 모바일 CSS scroll-snap 범위 = 홈
    const removeClass = () => html.classList.remove('snap-page');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return removeClass;

    const main = document.querySelector('main');
    const header = document.querySelector('header');
    if (!main) return removeClass;
    const sectionList = () =>
      Array.from(main.querySelectorAll(':scope > section')) as HTMLElement[];
    if (sectionList().length < 2) return removeClass;

    let animating = false;
    let cooldownUntil = 0;
    let raf = 0;

    const headerH = () => (header ? header.getBoundingClientRect().height : 0);
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const targets = () => {
      const H = headerH();
      const max = maxScroll();
      const ts = sectionList().map((s) =>
        Math.max(0, Math.min(max, Math.round(s.getBoundingClientRect().top + window.scrollY - H)))
      );
      return Array.from(new Set(ts)).sort((a, b) => a - b);
    };

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateTo = (target: number, dur = 620) => {
      animating = true;
      const start = window.scrollY;
      const dist = target - start;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, start + dist * easeInOutCubic(p));
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          animating = false;
          cooldownUntil = performance.now() + 260;
        }
      };
      raf = requestAnimationFrame(step);
    };

    const nextTarget = (dir: 1 | -1) => {
      const cur = window.scrollY;
      const ts = targets();
      if (dir > 0) return ts.find((t) => t > cur + 8);
      const ups = ts.filter((t) => t < cur - 8);
      return ups.length ? ups[ups.length - 1] : undefined;
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2) return;
      const now = performance.now();
      if (animating || now < cooldownUntil) {
        e.preventDefault();
        return;
      }
      const target = nextTarget(e.deltaY > 0 ? 1 : -1);
      if (target === undefined) return;
      e.preventDefault();
      animateTo(target);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      removeClass();
    };
  }, []);

  return null;
}
