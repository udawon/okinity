'use client';

import { useEffect } from 'react';

/**
 * 페이지 전체 방향성 섹션 스냅 — trickyknot의 "한 번 내리면 다음 섹션" 느낌을 재현.
 *
 * 휠/스와이프를 가로채(preventDefault) 진행 방향의 다음 섹션 경계로 직접 활강시킨다.
 * 스크롤-이벤트 기반이 아니라 입력(제스처) 기반이라 피드백 루프가 없고, 타이머 대신
 * performance.now() 타임스탬프 쿨다운을 써서 백그라운드 throttling에도 견고하다.
 *
 * - 스냅 목표 = 각 섹션 top − 헤더 높이(sticky 헤더에 헤딩이 가리지 않게).
 * - 한 제스처 = 한 섹션. 관성(트랙패드) 연속 이벤트는 animating/cooldown으로 흡수.
 * - 위/아래 끝에서는 가로채지 않음(네이티브 스크롤 허용).
 * - prefers-reduced-motion이면 비활성. 홈에서만 마운트.
 */
export default function ScrollSnap() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const main = document.querySelector('main');
    const header = document.querySelector('header');
    if (!main) return;
    const sectionList = () =>
      Array.from(main.querySelectorAll(':scope > section')) as HTMLElement[];
    if (sectionList().length < 2) return;

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
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          animating = false;
          // 트랙패드 관성 잔여 이벤트를 흡수할 쿨다운(타임스탬프 기반)
          cooldownUntil = performance.now() + 260;
        }
      };
      raf = requestAnimationFrame(step);
    };

    // 진행 방향의 다음 스냅 목표. 끝이면 undefined(네이티브 스크롤 허용).
    const nextTarget = (dir: 1 | -1) => {
      const cur = window.scrollY;
      const ts = targets();
      if (dir > 0) return ts.find((t) => t > cur + 8);
      const ups = ts.filter((t) => t < cur - 8);
      return ups.length ? ups[ups.length - 1] : undefined;
    };

    const handle = (dir: 1 | -1, e: Event) => {
      const now = performance.now();
      if (animating || now < cooldownUntil) {
        e.preventDefault(); // 관성/연속 입력 흡수
        return;
      }
      const target = nextTarget(dir);
      if (target === undefined) return; // 끝 → 네이티브 스크롤
      e.preventDefault();
      animateTo(target);
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2) return;
      handle(e.deltaY > 0 ? 1 : -1, e);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchStartY - e.touches[0].clientY; // 위로 스와이프(콘텐츠 하강)=양수
      if (Math.abs(dy) < 28) return;
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
