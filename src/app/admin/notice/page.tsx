import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseNoticeItems, sortNotices } from '@/lib/notice';
import AdminNav from '@/components/admin/AdminNav';
import NoticeAdminList from '@/components/admin/NoticeAdminList';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminNoticePage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.notice) : null;
  const posts = sortNotices(parseNoticeItems(value?.items));

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">공지사항</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-button border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            로그아웃
          </button>
        </form>
      </div>

      <div className="mt-4">
        <AdminNav />
      </div>

      {!enabled && (
        <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase가 연결되지 않아 공지를 저장할 수 없습니다.</p>
          <p className="mt-1">
            <code>.env.local</code> 에 SUPABASE 환경변수를 설정하세요.
          </p>
        </div>
      )}

      <p className="mb-4 mt-6 text-sm text-muted">
        공개 공지는 <code>/공지사항</code> 페이지에 표시됩니다. “상단 고정”은 목록 맨 위에 노출됩니다.
      </p>

      <NoticeAdminList posts={posts} disabled={!enabled} />
    </main>
  );
}
