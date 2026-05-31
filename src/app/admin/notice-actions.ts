'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { getSiteContent, setSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { NoticePostSchema, newNoticePost, parseNoticeItems, type NoticePost } from '@/lib/notice';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) {
    throw new Error('unauthorized');
  }
}

async function loadItems(): Promise<NoticePost[]> {
  const value = await getSiteContent(CONTENT_KEYS.notice);
  return parseNoticeItems(value?.items);
}

async function saveItems(items: NoticePost[]): Promise<void> {
  await setSiteContent(CONTENT_KEYS.notice, { items });
  revalidatePath('/', 'layout'); // /notice·/notice/[id] 일괄 무효화
}

export type NoticeActionState = { ok?: boolean; id?: string; error?: string };

/** 새 공지(초안) 생성 → 새 공지 id 반환. */
export async function createNotice(): Promise<NoticeActionState> {
  await requireAdmin();
  try {
    const items = await loadItems();
    const post = newNoticePost();
    await saveItems([post, ...items]);
    return { ok: true, id: post.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '생성 실패' };
  }
}

/** 공지 저장(있으면 교체, 없으면 추가). */
export async function saveNotice(input: NoticePost): Promise<NoticeActionState> {
  await requireAdmin();
  const parsed = NoticePostSchema.safeParse(input);
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

/** 공지 삭제. */
export async function deleteNotice(id: string): Promise<NoticeActionState> {
  await requireAdmin();
  try {
    const items = await loadItems();
    await saveItems(items.filter((p) => p.id !== id));
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '삭제 실패' };
  }
}
