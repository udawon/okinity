import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseNoticeItems } from '@/lib/notice';
import AdminNav from '@/components/admin/AdminNav';
import NoticeEditor from '@/components/admin/NoticeEditor';
import { logout } from '../../actions';

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
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">공지 편집</h1>
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

      <div className="mt-6">
        <Link href="/admin/notice" className="text-sm text-muted hover:text-ink">
          ← 공지사항 목록
        </Link>
      </div>

      <div className="mt-4">
        <NoticeEditor post={post} disabled={!enabled} />
      </div>
    </main>
  );
}
