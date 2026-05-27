'use client';

import { motion } from 'framer-motion';
import { Fragment } from 'react';

/**
 * Hero 헤드라인 "써지는" 타이포 — 애플 부팅 hello 톤.
 * 손글씨 폰트(Nanum Pen Script) + 글자별 좌→우 클립 리빌로 한 글자씩 써지듯 등장.
 *
 * - 단어는 inline-block + whitespace-nowrap 으로 묶어 줄바꿈이 단어 경계에서만 일어나게(한글 wrap).
 * - 글자별 등장은 전역 인덱스 기반 delay 로 연속 좌→우 시퀀스.
 * - prefers-reduced-motion이면 framer가 자동으로 모션 최소화.
 */
const EASE = [0.22, 1, 0.36, 1] as const;
const STEP = 0.14; // 글자 간 간격(초) — 절반 속도
const START = 1.0; // 시작 지연(초)
const DRAW = 0.52; // 글자 1개 그리는 시간(초) — 절반 속도

export default function HeroHandwriting({
  text,
  emphasis,
  className = '',
  emphasisClassName = ''
}: {
  text: string;
  /** 이 단어와 일치하면 emphasisClassName 적용(포인트 강조). */
  emphasis?: string;
  className?: string;
  emphasisClassName?: string;
}) {
  const words = text.split(' ');
  let gi = 0; // 전역 글자 인덱스

  return (
    <motion.h1
      className={`font-[family-name:var(--font-nanum-pen)] ${className}`}
      aria-label={text}
    >
      {words.map((word, wi) => {
        const isEmph = !!emphasis && word === emphasis;
        return (
          <Fragment key={wi}>
            <span className={`inline-block whitespace-nowrap ${isEmph ? emphasisClassName : ''}`}>
              {[...word].map((ch, ci) => {
                const delay = START + gi * STEP;
                gi += 1;
                return (
                  <motion.span
                    key={ci}
                    aria-hidden
                    className="inline-block"
                    initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: DRAW, ease: EASE, delay }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
            </span>
            {wi < words.length - 1 ? ' ' : ''}
          </Fragment>
        );
      })}
    </motion.h1>
  );
}
