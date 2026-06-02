import type { ReactNode } from 'react';
import Link from 'next/link';
import AdminNav from './AdminNav';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { logout } from '@/app/admin/actions';

/**
 * 어드민 공통 셸 — 헤더(제목·사이트보기·로그아웃) + 탭 네비 + Supabase 경고 + (선택)백링크.
 * 모든 어드민 페이지가 이 셸로 콘텐츠를 감싼다. (이전엔 9개 페이지가 동일 chrome을 복붙)
 */
export default function AdminShell({
  title,
  back,
  children
}: {
  title: string;
  /** 에디터 페이지의 "← 목록" 링크 */
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  const enabled = isSupabaseEnabled();

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-button border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            사이트 보기 ↗
          </a>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-button border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <div className="mt-4">
        <AdminNav />
      </div>

      {!enabled && (
        <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase가 연결되지 않아 변경 내용을 저장할 수 없습니다.</p>
          <p className="mt-1">
            <code>.env.local</code> 에 <code>SUPABASE_URL</code>,{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> 를 설정하세요.
          </p>
        </div>
      )}

      {back && (
        <div className="mt-6">
          <Link href={back.href} className="text-sm text-muted hover:text-ink">
            ← {back.label}
          </Link>
        </div>
      )}

      <div className={back ? 'mt-4' : 'mt-6'}>{children}</div>
    </main>
  );
}
