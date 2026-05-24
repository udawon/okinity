'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { setSiteContent, uploadMedia, type Json } from '@/lib/site-content';

/** 서버액션 2차 방어 — 미들웨어 외에 세션 재검증. */
async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) {
    throw new Error('unauthorized');
  }
}

export type SaveState = { ok?: boolean; error?: string };

/** 영역 콘텐츠 저장 후 메인 전체 무효화. */
export async function saveContent(key: string, value: Json): Promise<SaveState> {
  await requireAdmin();
  try {
    await setSiteContent(key, value);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '저장 실패' };
  }
}

export type UploadState = { url?: string; error?: string };

/** 미디어 업로드 → 공개 URL 반환. */
export async function uploadMediaAction(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  await requireAdmin();
  const file = formData.get('file');
  const prefix = String(formData.get('prefix') ?? 'misc');
  if (!(file instanceof File) || file.size === 0) {
    return { error: '파일을 선택하세요.' };
  }
  // 50MB 상한 (동영상 고려). Supabase 무료 티어/요금 보호.
  if (file.size > 50 * 1024 * 1024) {
    return { error: '파일이 너무 큽니다(최대 50MB).' };
  }
  try {
    const url = await uploadMedia(file, prefix);
    return { url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '업로드 실패' };
  }
}
