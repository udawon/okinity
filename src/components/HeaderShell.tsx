'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * 헤더 껍데기 — 스크롤 위치에 따라 배경을 전환한다(trickyknot 방식).
 * 최상단(Hero 영상 위): 투명 + 상단 그라데이션 스크림(가독성만 확보).
 * 스크롤 후: 다크 글래스(블러 + 하단 보더)로 부드럽게 전환.
 *
 * Header는 server 컴포넌트(번역)라 콘텐츠를 children으로 받고, 여기선 배경만 제어한다.
 */
export default function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); // 초기 진입(새로고침 후 스크롤된 상태) 반영
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? 'border-b border-white/10 bg-[#06151d]/60 backdrop-blur-md'
          : 'border-b border-transparent bg-gradient-to-b from-black/35 to-transparent'
      }`}
    >
      {children}
    </header>
  );
}
