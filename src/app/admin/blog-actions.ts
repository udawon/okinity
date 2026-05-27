'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { getSiteContent, setSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { BlogPostSchema, newBlogPost, parseBlogItems, type BlogPost } from '@/lib/blog';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) {
    throw new Error('unauthorized');
  }
}

async function loadItems(): Promise<BlogPost[]> {
  const value = await getSiteContent(CONTENT_KEYS.blog);
  return parseBlogItems(value?.items);
}

async function saveItems(items: BlogPost[]): Promise<void> {
  await setSiteContent(CONTENT_KEYS.blog, { items });
  revalidatePath('/', 'layout'); // 홈·/blog·/blog/[id] 일괄 무효화
}

export type BlogActionState = { ok?: boolean; id?: string; error?: string };

/** 새 글(초안) 생성 → 새 글 id 반환(작성 화면으로 이동용). */
export async function createBlogPost(): Promise<BlogActionState> {
  await requireAdmin();
  try {
    const items = await loadItems();
    const post = newBlogPost();
    await saveItems([post, ...items]);
    return { ok: true, id: post.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '생성 실패' };
  }
}

/** 글 저장(있으면 교체, 없으면 추가). */
export async function saveBlogPost(input: BlogPost): Promise<BlogActionState> {
  await requireAdmin();
  const parsed = BlogPostSchema.safeParse(input);
  if (!parsed.success) return { error: '입력 형식이 올바르지 않습니다.' };
  const post = parsed.data;
  try {
    const items = await loadItems();
    const idx = items.findIndex((p) => p.id === post.id);
    if (idx >= 0) items[idx] = post;
    else items.unshift(post);
    await saveItems(items);
    return { ok: true, id: post.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '저장 실패' };
  }
}

/** 글 삭제. */
export async function deleteBlogPost(id: string): Promise<BlogActionState> {
  await requireAdmin();
  try {
    const items = await loadItems();
    await saveItems(items.filter((p) => p.id !== id));
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '삭제 실패' };
  }
}
