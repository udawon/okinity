import type { ReactNode } from 'react';
import Link from 'next/link';
import AdminNav from './AdminNav';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { logout } from '@/app/admin/actions';

/**
 * 어드민 공통 셸 — 왼쪽 사이드바(데스크톱) / 상단 가로 메뉴(모바일) + 제목 + Supabase 경고 + (선택)백링크.
 * 모든 어드민 페이지가 이 셸로 콘텐츠를 감싼다.
 */
export default function AdminShell({
  title,
  back,
  actions,
  children
}: {
  title: string;
  /** 에디터 페이지의 "← 목록" 링크 */
  back?: { href: string; label: string };
  /** 제목 오른쪽 버튼 영역(선택) */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const enabled = isSupabaseEnabled();

  const footer = (
    <div className="flex flex-col gap-1">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-ink"
      >
        사이트 보기 ↗
      </a>
      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-bg hover:text-ink"
        >
          로그아웃
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:px-3 lg:py-6">
        <Link href="/admin" className="px-3 text-lg font-extrabold tracking-wide text-ink">
          OKINITY <span className="text-xs font-medium text-muted">관리자</span>
        </Link>
        <div className="mt-8 flex-1 overflow-y-auto">
          <AdminNav variant="side" />
        </div>
        <div className="border-t border-line pt-3">{footer}</div>
      </aside>

      {/* 모바일 상단 바 */}
      <div className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="text-base font-extrabold tracking-wide text-ink">
            OKINITY <span className="text-xs font-medium text-muted">관리자</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-muted hover:text-ink">
              로그아웃
            </button>
          </form>
        </div>
        <AdminNav variant="bar" />
      </div>

      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">
          {back && (
            <Link href={back.href} className="text-sm text-muted hover:text-ink">
              ← {back.label}
            </Link>
          )}
          <header className={`flex flex-wrap items-center justify-between gap-3 ${back ? 'mt-2' : ''}`}>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            {actions}
          </header>

          {!enabled && (
            <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Supabase가 연결되지 않아 변경 내용을 저장할 수 없습니다.</p>
              <p className="mt-1">
                <code>.env.local</code> 에 <code>SUPABASE_URL</code>,{' '}
                <code>SUPABASE_SERVICE_ROLE_KEY</code> 를 설정하세요.
              </p>
            </div>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
