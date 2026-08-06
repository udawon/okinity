'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { setSiteContent, createSignedUpload, type Json } from '@/lib/site-content';

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
 * 업로드 상한 — 파일 본문이 서버를 거치지 않으므로 플랫폼 한도가 아니라 "방문자 부담" 기준.
 * 영상 50MB: Supabase 프로젝트 기본 파일 상한과도 일치하고, 1080p 1~2분 클립이 들어가는 크기.
 * 그보다 큰 영상은 방문자(특히 모바일)에게 전송량 부담이 커 애초에 올리지 않는 편이 낫다.
 */
// ('use server' 모듈은 async 함수만 export 할 수 있어 내부 상수로 둔다)
const UPLOAD_LIMITS = {
  image: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024
} as const;

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
