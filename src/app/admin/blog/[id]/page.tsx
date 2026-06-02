import { notFound } from 'next/navigation';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseBlogItems } from '@/lib/blog';
import AdminShell from '@/components/admin/AdminShell';
import BlogEditor from '@/components/admin/BlogEditor';

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
    <AdminShell title="글 편집" back={{ href: '/admin/blog', label: '블로그 목록' }}>
      <BlogEditor post={post} disabled={!enabled} />
    </AdminShell>
  );
}
