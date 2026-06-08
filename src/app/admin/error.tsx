'use client';

import Link from 'next/link';

/**
 * 어드민 에러 바운더리 — 데이터 저장소(Supabase/Postgres) 일시 장애 등으로
 * 서버 컴포넌트가 throw하면 500 크래시 대신 이 안내 화면을 보여준다.
 * 관리자가 원인을 인지하고 재시도할 수 있게 한다.
 */
export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-container px-5 py-16 sm:px-6">
      <div className="rounded-card border border-line bg-white p-8">
        <h1 className="text-2xl font-bold text-ink">데이터를 불러오지 못했습니다</h1>
        <p className="mt-3 text-sm text-muted">
          저장소(데이터베이스) 연결에 일시적인 문제가 있을 수 있습니다. 잠시 후 다시
          시도해 주세요. 문제가 계속되면 환경변수(Supabase/Postgres 설정)를 확인하세요.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted">오류 코드: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-button bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            다시 시도
          </button>
          <Link
            href="/admin"
            className="rounded-button border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            대시보드로
          </Link>
        </div>
      </div>
    </main>
  );
}
