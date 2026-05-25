'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export type OceanVideos = {
  surface?: string | null;
  mid?: string | null;
  deep?: string | null;
};

/**
 * 바다 하강 배경 — 화면 고정(fixed). 스크롤 진행도에 따라
 * 수면 → 중층(빛줄기) → 심해 영상 레이어가 페이드 전환된다(trickyknot 방식).
 *
 * 영상이 없으면(props 비어있으면) 색 그라데이션만으로도 동일한 깊이 전환을 보여준다.
 * → public/videos/{surface,mid,deep}.mp4 를 넣으면 자동으로 영상 레이어 활성.
 */
export default function OceanBackground({ videos }: { videos?: OceanVideos }) {
  const { scrollYProgress } = useScroll();

  // 레이어별 opacity (수면 → 중층 → 심해로 교차 페이드)
  const oSurface = useTransform(scrollYProgress, [0, 0.22, 0.34], [1, 1, 0]);
  const oMid = useTransform(scrollYProgress, [0.26, 0.42, 0.56, 0.68], [0, 1, 1, 0]);
  const oDeep = useTransform(scrollYProgress, [0.6, 0.74, 1], [0, 1, 1]);

  // 영상 위에 깔리는 바다색 틴트(깊이감 + 가독성). 영상이 없으면 이 자체가 배경.
  const tint = useTransform(
    scrollYProgress,
    [0, 0.3, 0.65, 1],
    [
      'rgba(31,130,148,0.40)',
      'rgba(14,84,104,0.50)',
      'rgba(8,47,68,0.62)',
      'rgba(4,19,29,0.80)'
    ]
  );

  const layers: { src?: string | null; opacity: typeof oSurface }[] = [
    { src: videos?.surface, opacity: oSurface },
    { src: videos?.mid, opacity: oMid },
    { src: videos?.deep, opacity: oDeep }
  ];

  return (
    <div className="fixed inset-0 -z-10 bg-[#06151d]" aria-hidden>
      {layers.map((l, i) =>
        l.src ? (
          <motion.video
            key={i}
            style={{ opacity: l.opacity }}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src={l.src} type="video/mp4" />
          </motion.video>
        ) : null
      )}

      {/* 바다색 틴트 (영상 위 / 영상 없을 때 배경) */}
      <motion.div className="absolute inset-0" style={{ backgroundColor: tint }} />
      {/* 상단 빛 + 하단 어둠 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/40" />
    </div>
  );
}
