'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStableReducedMotion } from '@/hooks/useStableReducedMotion';

export type OceanVideos = {
  surface?: string | null;
  mid?: string | null;
  under?: string | null;
  deep?: string | null;
};

/**
 * 바다 하강 배경 — 화면 고정(fixed). "현재 섹션"에 따라 깊이를 이산적으로 전환한다:
 *   해수면(surface) → 바다(mid) → 깊은 바다(deep).
 *
 * 단, 영상 배경은 **홈(시네마틱 풀스크린)에서만** 사용한다. 서브 페이지(/contact·/blog·
 * /gallery·/tours/* 등)는 영상 대신 정적 "물결+공기방울" 앰비언트 배경(OceanAmbient)을 깐다.
 * 서브 페이지는 일반 문서형 레이아웃이라 풀스크린 Hero 영상이 어울리지 않기 때문.
 *
 * 섹션 인덱스 → 깊이 매핑(홈 기준):
 *   Hero=해수면(surface), 투어=바다(mid), 시그니처=수중(under), 갤러리·후기=깊은바다(deep).
 */
const DEPTH_BY_SECTION = [0, 1, 2, 3, 3]; // 0=surface, 1=mid, 2=under, 3=deep

const TINT = [
  'transparent', // 해수면 surface (Hero — 필터 없이 원본 영상 그대로)
  'rgba(14,92,112,0.48)', // 바다 mid
  'rgba(9,58,80,0.56)', // 수중 under
  'rgba(5,28,42,0.66)' // 깊은 바다 deep
];

// 떠오르는 공기방울 입자 — 결정론적 배치(SSR-safe, Math.random 미사용).
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const left = (i * 61.8) % 100; // 황금각 분산
  const size = 2 + ((i * 7) % 5);
  const dur = 8 + ((i * 3) % 8);
  const delay = (i % 9) * 0.8;
  const op = 0.16 + (i % 4) * 0.1;
  const drift = (i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 4);
  return { left, size, dur, delay, op, drift, bottom: (i * 37) % 92 };
});

const CAUSTICS_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cg fill='none' stroke='%2389f0ff' stroke-width='1.2' stroke-opacity='0.6'%3E%3Cpath d='M0 60 Q55 20 110 60 T220 60'/%3E%3Cpath d='M0 120 Q55 80 110 120 T220 120'/%3E%3Cpath d='M0 180 Q55 140 110 180 T220 180'/%3E%3C/g%3E%3C/svg%3E\")";

/** 서브 페이지 정적 배경 — 깊은 바다 그라데이션 + 빛기둥 + 물결 코스틱 + 떠오르는 공기방울. */
function OceanAmbient() {
  const reduce = useStableReducedMotion();
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#06151d]" aria-hidden>
      {/* 깊은 바다 그라데이션 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 28%, #0b4658 0%, #063040 52%, #03161e 100%)'
        }}
      />
      {/* 수중 광선(빛기둥) */}
      <div
        className="ocean-rays absolute -top-1/4 left-1/2 h-[150%] w-[72%] -translate-x-1/2 mix-blend-screen"
        style={{
          background:
            'linear-gradient(180deg, rgba(150,240,255,0.22) 0%, rgba(120,220,240,0.05) 45%, transparent 80%)',
          filter: 'blur(10px)'
        }}
      />
      {/* 물결 코스틱(수면 굴절 무늬) */}
      <div
        className="ocean-caustics absolute inset-0 opacity-[0.10] mix-blend-screen"
        style={{ backgroundImage: CAUSTICS_SVG, backgroundSize: '220px 220px' }}
      />
      {/* 떠오르는 공기방울 */}
      {!reduce &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="ocean-particle absolute rounded-full bg-cyan-100/80"
            style={
              {
                left: `${p.left}%`,
                bottom: `${p.bottom}%`,
                width: p.size,
                height: p.size,
                ['--p-dur']: `${p.dur}s`,
                ['--p-delay']: `${p.delay}s`,
                ['--p-op']: p.op,
                ['--p-x']: `${p.drift}px`,
                boxShadow: '0 0 6px rgba(180,240,255,0.7)'
              } as React.CSSProperties
            }
          />
        ))}
      {/* 비네팅(가장자리 어둡게) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_38%,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}

export default function OceanBackground({ videos }: { videos?: OceanVideos }) {
  const pathname = usePathname();
  const [depth, setDepth] = useState(0);

  // 홈(로케일 루트, 예: /ko)만 영상 배경. 그 외 서브 페이지는 정적 앰비언트.
  const isHome = pathname.split('/').filter(Boolean).length <= 1;

  useEffect(() => {
    if (!isHome) return; // 서브 페이지는 깊이 스크롤 추적 불필요
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
  }, [isHome]);

  if (!isHome) return <OceanAmbient />;

  const layers = [videos?.surface, videos?.mid, videos?.under, videos?.deep];

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
      {/* 하단 어둠 — 해수면(Hero)에선 미적용(원본 영상 그대로), 그 아래 깊이에서만 */}
      {depth > 0 && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      )}
    </div>
  );
}
