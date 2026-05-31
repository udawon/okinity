import { type ReactNode } from 'react';

/**
 * 루트 레이아웃 — 통과(pass-through)용.
 *
 * 실제 <html>/<body> 는 로케일 레이아웃([locale]/layout.tsx)과 전역 404(not-found.tsx)가
 * 각자 렌더한다. 다만 Next.js 는 루트 not-found.tsx 가 있으면 루트 layout.tsx 의 "존재"를
 * 요구하므로(없으면 "not-found.tsx doesn't have a root layout" 빌드 에러), children 만
 * 그대로 통과시키는 레이아웃을 둔다. (next-intl [locale] 구성의 공식 권장 패턴)
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
