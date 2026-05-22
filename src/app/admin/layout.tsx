import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin · PONYOKINAWA',
  robots: { index: false, follow: false } // 어드민은 검색 비색인
};

// /admin 은 [locale] 밖의 독립 루트 레이아웃 (다국어 미적용).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-bg font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
