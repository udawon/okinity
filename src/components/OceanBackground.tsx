'use client';

import { useEffect, useState } from 'react';

export type OceanVideos = {
  surface?: string | null;
  mid?: string | null;
  deep?: string | null;
};

/**
 * 바다 하강 배경 — 화면 고정(fixed). "현재 섹션"에 따라 깊이를 이산적으로 전환한다:
 *   해수면(surface) → 바다(mid) → 깊은 바다(deep).
 *
 * 연속 스크롤 진행도로 교차페이드하던 이전 방식은 섹션 사이 넓은 구간에서 두 영상이
 * 오래 섞여 보였다. 스냅이 섹션 단위로 안착하므로, 각 섹션에 머무는 동안엔 항상 한
 * 영상만 보이게 하고(블렌드 정체 없음), 다음 섹션으로 넘어갈 때만 CSS로 부드럽게 전환.
 *
 * 섹션 인덱스 → 깊이 매핑(홈 기준): Hero·투어=해수면, 시그니처=바다, 갤러리·후기=깊은바다.
 * 영상이 없으면 색 틴트만으로 동일한 깊이감을 보여준다(graceful).
 */
const DEPTH_BY_SECTION = [0, 0, 1, 2, 2]; // 0=surface, 1=mid, 2=deep

const TINT = [
  'rgba(28,120,140,0.40)', // 해수면
  'rgba(12,78,98,0.52)', // 바다
  'rgba(5,28,42,0.66)' // 깊은 바다
];

export default function OceanBackground({ videos }: { videos?: OceanVideos }) {
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const secs = Array.from(main.querySelectorAll(':scope > section')) as HTMLElement[];
      if (secs.length === 0) return;
      // 뷰포트 상단에서 40% 지점을 넘은 마지막 섹션을 "현재 섹션"으로 본다.
      const line = window.scrollY + window.innerHeight * 0.4;
      let idx = 0;
      secs.forEach((s, i) => {
        const top = s.getBoundingClientRect().top + window.scrollY;
        if (line >= top) idx = i;
      });
      const d = DEPTH_BY_SECTION[Math.min(idx, DEPTH_BY_SECTION.length - 1)] ?? 2;
      setDepth(d);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const layers = [videos?.surface, videos?.mid, videos?.deep];

  return (
    <div className="fixed inset-0 -z-10 bg-[#06151d]" aria-hidden>
      {layers.map((src, i) =>
        src ? (
          <video
            key={i}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
              i === depth ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : null
      )}

      {/* 바다색 틴트 (영상 위 / 영상 없을 때 배경) — 깊이별 색 + 부드러운 전환 */}
      <div
        className="absolute inset-0 transition-colors duration-[1200ms] ease-in-out"
        style={{ backgroundColor: TINT[depth] }}
      />
      {/* 상단 빛 + 하단 어둠 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/40" />
    </div>
  );
}
