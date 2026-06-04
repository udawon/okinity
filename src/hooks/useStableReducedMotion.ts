'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * SSR 안정화 reduced-motion 훅.
 *
 * framer-motion의 useReducedMotion()은 SSR·첫 클라이언트 렌더에서 false를 주고,
 * 마운트 후 실제 미디어쿼리(prefers-reduced-motion) 값으로 갱신된다. 이 값으로 렌더를
 * 분기하면 '애니메이션 제거'를 켠 사용자에서 서버 HTML과 첫 클라이언트 렌더가 어긋나
 * 하이드레이션 미스매치 경고가 발생한다.
 *
 * 이 훅은 마운트 전까지 항상 false(=SSR과 동일)를 반환하고, 마운트 후에만 실제 값을
 * 노출한다. 첫 클라이언트 렌더가 SSR과 일치하므로 하이드레이션 미스매치가 사라진다.
 * (모션 저감은 마운트 직후 한 틱 뒤 적용된다 — 시각적으로는 무시 가능.)
 */
export function useStableReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? !!reduce : false;
}
