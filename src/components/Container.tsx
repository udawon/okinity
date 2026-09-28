import type { ReactNode } from 'react';

/** 콘텐츠 폭 — default: 전체 레이아웃(1248px) · text: 읽기용 본문(768px) · narrow: 글 1단(672px). */
const WIDTH = {
  default: 'max-w-container',
  text: 'max-w-3xl',
  narrow: 'max-w-2xl'
} as const;

/**
 * 페이지 콘텐츠 최대폭·좌우 패딩을 통일하는 레이아웃 헬퍼.
 * 폭은 반드시 size 로 지정한다 — className 에 max-w-* 를 넣으면 기본 max-w-container 와
 * 충돌해 CSS 생성 순서에 따라 무시된다(2026-09 이전 투어·블로그 본문이 1248px 로 퍼졌던 원인).
 */
export default function Container({
  children,
  className = '',
  size = 'default'
}: {
  children: ReactNode;
  className?: string;
  size?: keyof typeof WIDTH;
}) {
  return (
    <div className={`mx-auto w-full ${WIDTH[size]} px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
