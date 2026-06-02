import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseNoticeItems, sortNotices } from '@/lib/notice';
import AdminShell from '@/components/admin/AdminShell';
import NoticeAdminList from '@/components/admin/NoticeAdminList';

export const dynamic = 'force-dynamic';

export default async function AdminNoticePage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.notice) : null;
  const posts = sortNotices(parseNoticeItems(value?.items));

  return (
    <AdminShell title="공지사항">
      <p className="mb-4 text-sm text-muted">
        공개 공지는 <code>/공지사항</code> 페이지에 표시됩니다. “상단 고정”은 목록 맨 위에 노출됩니다.
      </p>

      <NoticeAdminList posts={posts} disabled={!enabled} />
    </AdminShell>
  );
}
