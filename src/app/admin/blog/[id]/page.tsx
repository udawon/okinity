import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseBlogItems } from '@/lib/blog';
import AdminNav from '@/components/admin/AdminNav';
import BlogEditor from '@/components/admin/BlogEditor';
import { logout } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function AdminBlogEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.blog) : null;
  const posts = parseBlogItems(value?.items);
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">글 편집</h1>
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
        <Link href="/admin/blog" className="text-sm text-muted hover:text-ink">
          ← 블로그 목록
        </Link>
      </div>

      <div className="mt-4">
        <BlogEditor post={post} disabled={!enabled} />
      </div>
    </main>
  );
}
