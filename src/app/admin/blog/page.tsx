import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseBlogItems, sortByDateDesc } from '@/lib/blog';
import AdminNav from '@/components/admin/AdminNav';
import BlogAdminList from '@/components/admin/BlogAdminList';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.blog) : null;
  const posts = sortByDateDesc(parseBlogItems(value?.items));

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">블로그</h1>
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
          <p className="font-semibold">Supabase가 연결되지 않아 글을 저장할 수 없습니다.</p>
          <p className="mt-1">
            <code>.env.local</code> 에 SUPABASE 환경변수를 설정하세요.
          </p>
        </div>
      )}

      <p className="mb-4 mt-6 text-sm text-muted">
        “오늘의 오키니티” 영역에 노출됩니다. 공개글 최신 8개가 메인 캐러셀에 표시됩니다.
      </p>

      <BlogAdminList posts={posts} disabled={!enabled} />
    </main>
  );
}
