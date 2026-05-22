import Link from 'next/link';

/**
 * 전역 not-found — 로케일 세그먼트 밖(예: 매칭 안 된 최상위 경로)에서 렌더.
 * 루트 레이아웃이 [locale]/layout.tsx에 있으므로 여기서 html/body를 직접 포함한다.
 */
export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          color: '#0f172a'
        }}
      >
        <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>404</h1>
        <p style={{ color: '#64748b' }}>Page not found</p>
        <Link href="/ko" style={{ color: '#0b7c8a', fontWeight: 600 }}>
          PONYOKINAWA
        </Link>
      </body>
    </html>
  );
}
