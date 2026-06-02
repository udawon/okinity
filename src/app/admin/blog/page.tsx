import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseBlogItems, sortByDateDesc } from '@/lib/blog';
import AdminShell from '@/components/admin/AdminShell';
import BlogAdminList from '@/components/admin/BlogAdminList';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.blog) : null;
  const posts = sortByDateDesc(parseBlogItems(value?.items));

  return (
    <AdminShell title="블로그">
      <p className="mb-4 text-sm text-muted">
        “오늘의 오키니티” 영역에 노출됩니다. 공개글 최신 8개가 메인 캐러셀에 표시됩니다.
      </p>

      <BlogAdminList posts={posts} disabled={!enabled} />
    </AdminShell>
  );
}
