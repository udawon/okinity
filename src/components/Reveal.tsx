'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

// trickyknot 톤의 시네마틱 진입 — 살짝 떠오르며(translateY) 페이드인.
// 빠른 튕김 없이 길게 감속하는 ease-out(quint) 곡선.
const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  /** 렌더 태그. 기본 'div'. 리스트 항목이면 'li' 등. */
  as?: 'div' | 'li' | 'section' | 'article';
  /** 진입 지연(초). 같은 그룹을 순차로 나타낼 때(stagger) 사용. */
  delay?: number;
  /** 떠오르는 거리(px). 기본 28. */
  y?: number;
  /** 지속(초). 기본 0.8. */
  duration?: number;
  className?: string;
} & Omit<HTMLMotionProps<'div'>, 'children' | 'initial' | 'whileInView' | 'viewport' | 'transition'>;

/**
 * 뷰포트 진입 시 한 번만 페이드+상승하는 래퍼.
 * 서버 컴포넌트 안에서도 children을 감싸 사용할 수 있다(이 파일은 client).
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 28,
  duration = 0.8,
  className,
  ...rest
}: RevealProps) {
  // 다형 태그 — 런타임은 as에 맞는 엘리먼트를 렌더하고, 타입은 div props로 통일.
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
