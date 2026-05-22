import type { ReactNode } from 'react';

/** 페이지 콘텐츠 최대폭·좌우 패딩을 통일하는 레이아웃 헬퍼. */
export default function Container({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-container px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
