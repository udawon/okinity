'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * 바다 하강 배경 — 화면 고정(fixed). 페이지 스크롤 진행도에 따라
 * 수면(밝은 청록) → 중층(블루) → 심해(네이비)로 배경색이 전환된다.
 * 콘텐츠는 이 위를 자유롭게 스크롤하며 "깊이 내려가는" 몰입감을 만든다.
 * (실제 바다 영상 레이어는 추후 CMS/자산으로 얹을 수 있음.)
 */
export default function OceanBackground() {
  const { scrollYProgress } = useScroll();
  const color = useTransform(
    scrollYProgress,
    [0, 0.3, 0.65, 1],
    ['#1f8294', '#0e5468', '#082f44', '#04131d']
  );

  return (
    <motion.div
      className="fixed inset-0 -z-10"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {/* 상단에서 빛이 스며드는 깊이감 + 하단 어둠 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/45" />
    </motion.div>
  );
}
