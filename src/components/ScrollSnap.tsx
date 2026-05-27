'use client';

import { useEffect } from 'react';

/**
 * 홈 섹션 스냅 — 데스크탑/모바일 각각의 입력 특성에 맞춰 처리.
 *
 * 데스크탑(휠): 휠을 가로채(preventDefault) 진행 방향 다음 섹션으로 직접 활강.
 * 모바일(터치, pointer:coarse): 네이티브 스크롤을 막지 않고 자유롭게 흐르게 둔 뒤,
 *   스크롤이 "멈추면"(관성 종료) 가장 가까운 섹션으로 부드럽게 안착시킨다.
 *   → preventDefault로 터치를 가로채지 않으므로 브라우저 개입/관성 충돌이 없다.
 *
 * - 스냅 목표 = 각 섹션 top − 헤더 높이(sticky 헤더에 헤딩이 가리지 않게).
 * - animating/cooldown(performance.now)으로 안착 애니메이션의 scroll 이벤트가
 *   재트리거하지 않게 한다. prefers-reduced-motion이면 비활성. 홈에서만 마운트.
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

    const animateTo = (target: number, dur = 560) => {
      animating = true;
      const start = window.scrollY;
      const dist = target - start;
      if (Math.abs(dist) < 2) {
        animating = false;
        return;
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, start + dist * easeInOutCubic(p));
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          animating = false;
          cooldownUntil = performance.now() + 250; // 잔여 관성/이벤트 흡수
        }
      };
      raf = requestAnimationFrame(step);
    };

    // ── 데스크탑: 휠 가로채기(진행 방향 다음 섹션) ───────────────────────
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
      if (target === undefined) return; // 끝 → 네이티브 스크롤
      e.preventDefault();
      animateTo(target);
    };

    // ── 모바일/터치: 스크롤이 멈추면 가장 가까운 섹션으로 안착 ──────────
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const nearestTarget = () => {
      const ts = targets();
      const y = window.scrollY;
      return ts.reduce((best, t) => (Math.abs(t - y) < Math.abs(best - y) ? t : best), ts[0]);
    };
    const onScroll = () => {
      if (animating || performance.now() < cooldownUntil) return;
      if (settleTimer) clearTimeout(settleTimer);
      // 관성이 끝날 때까지 기다렸다가(스크롤 정지 후) 안착
      settleTimer = setTimeout(() => {
        if (animating) return;
        const target = nearestTarget();
        if (Math.abs(target - window.scrollY) > 2) animateTo(target);
      }, 140);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    if (isTouch) window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (settleTimer) clearTimeout(settleTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return null;
}
