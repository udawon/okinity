import { notFound } from 'next/navigation';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseNoticeItems } from '@/lib/notice';
import AdminShell from '@/components/admin/AdminShell';
import NoticeEditor from '@/components/admin/NoticeEditor';

export const dynamic = 'force-dynamic';

export default async function AdminNoticeEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.notice) : null;
  const post = parseNoticeItems(value?.items).find((p) => p.id === id);
  if (!post) notFound();

  return (
    <AdminShell title="공지 편집" back={{ href: '/admin/notice', label: '공지사항 목록' }}>
      <NoticeEditor post={post} disabled={!enabled} />
    </AdminShell>
  );
}
