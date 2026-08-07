'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { setSiteContent, createSignedUpload, type Json } from '@/lib/site-content';
import { UPLOAD_LIMITS } from '@/lib/upload-limits';

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

export type SignedUploadState = { uploadUrl?: string; publicUrl?: string; error?: string };

/**
 * 브라우저 직행 업로드용 서명 URL 발급.
 * 실제 바이트는 브라우저 → Supabase 로 직접 전송된다(서버액션은 URL만 중계).
 */
export async function createUploadUrlAction(input: {
  filename: string;
  prefix: string;
  contentType: string;
  size: number;
}): Promise<SignedUploadState> {
  await requireAdmin();
  const { filename, prefix, contentType, size } = input;
  if (!filename || !size) return { error: '파일을 선택하세요.' };

  const isVideo = contentType.startsWith('video/');
  const isImage = contentType.startsWith('image/');
  if (!isVideo && !isImage) return { error: '이미지 또는 동영상 파일만 올릴 수 있습니다.' };

  const limit = isVideo ? UPLOAD_LIMITS.video : UPLOAD_LIMITS.image;
  if (size > limit) {
    const mb = Math.round(limit / 1024 / 1024);
    return {
      error: isVideo
        ? `동영상이 너무 큽니다(최대 ${mb}MB). 길이를 줄이거나 1080p로 다시 내보낸 뒤 올려주세요.`
        : `이미지가 너무 큽니다(최대 ${mb}MB).`
    };
  }

  try {
    const { uploadUrl, publicUrl } = await createSignedUpload(filename, prefix);
    return { uploadUrl, publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '업로드 준비 실패' };
  }
}
