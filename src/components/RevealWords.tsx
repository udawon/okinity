'use client';

import { motion } from 'framer-motion';
import { Fragment } from 'react';

// trickyknot 헤딩 reveal — 뷰포트 진입 시 단어가 왼쪽부터 흐릿→선명으로 밝아진다.
const EASE = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } }
};
const wordVariant = {
  hidden: { opacity: 0.18, y: '0.18em' },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } }
};

/**
 * 헤딩 텍스트를 단어 단위로 쪼개 순차 brighten.
 * - 단어 사이 공백은 일반 텍스트 노드 → 줄바꿈(wrap) 유지(긴 한글 제목 대응).
 * - 스크린리더용으로 Tag에 aria-label, 각 span은 aria-hidden.
 */
export default function RevealWords({
  text,
  as = 'h2',
  className
}: {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const Tag = motion[as] as typeof motion.h2;
  const words = text.split(' ');

  return (
    <Tag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <motion.span variants={wordVariant} className="inline-block" aria-hidden>
            {w}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  );
}
