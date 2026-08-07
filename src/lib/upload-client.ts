'use client';

import { createUploadUrlAction } from '@/app/admin/content-actions';
import { UPLOAD_LIMITS } from '@/lib/upload-limits';
import { compressVideoFile } from '@/lib/video-compress';

/**
 * 어드민 미디어 업로드 — 브라우저에서 Supabase Storage 로 직접 전송한다.
 *
 * 설계 목적은 두 가지다.
 *  1) 업로드 가능 용량: 파일 본문이 Vercel 서버리스 함수를 거치지 않으므로 요청 본문
 *     한도(4.5MB)에 걸리지 않는다. 영상 업로드가 가능해지는 전제 조건.
 *  2) 방문자 전송량: 올리는 시점에 이미지는 축소·WebP 압축하고, 영상은 첫 프레임을 뽑아
 *     포스터 이미지를 함께 만든다. 덕분에 공개 페이지는 영상 바이트를 받지 않고도
 *     썸네일을 보여줄 수 있다(재생 버튼을 눌러야 비로소 영상이 내려간다).
 */

/** 어드민 영상 업로드 안내 — 방문자 전송량을 고려한 권장 사양. */
export const VIDEO_UPLOAD_HINT =
  '용량 제한 없이 올릴 수 있습니다 — 50MB를 넘는 영상은 브라우저에서 자동 압축됩니다(화질을 위해 3분 이내 권장). 썸네일은 첫 프레임으로 자동 생성되고, 방문자는 재생 버튼을 눌러야 영상을 내려받습니다.';

/** 이미지 업로드 전 축소·압축(canvas, 무의존). 긴 변을 maxDim으로 제한하고 WebP로 인코딩. */
export async function compressImage(file: File, maxDim = 2000, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  // 이미 작은 WebP 면 재인코딩 불필요(화질 보존)
  if (file.type === 'image/webp' && file.size <= 600 * 1024) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('이미지 로드 실패'));
      im.src = url;
    });
    const blob = await drawToWebp(img, img.width, img.height, maxDim, quality);
    if (!blob || blob.size >= file.size) return file; // 압축 이득 없으면 원본 유지
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file; // 압축 실패 시 원본으로 폴백
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 영상 첫 부분의 한 프레임을 뽑아 포스터(WebP) 파일로 만든다.
 * 공개 페이지에서 `<video preload="none" poster=...>` 로 쓰면, 방문자는 재생을 누르기 전까지
 * 영상 바이트를 한 바이트도 받지 않는다(수십 MB 자동 다운로드 방지의 핵심).
 *
 * 브라우저가 디코딩하지 못하는 코덱(예: HEVC .mov)이면 null — 호출부는 포스터 없이 진행한다.
 */
export async function captureVideoPoster(file: File): Promise<File | null> {
  if (!file.type.startsWith('video/')) return null;
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  try {
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;

    await waitFor(video, 'loadedmetadata', 20_000);
    if (!video.videoWidth || !video.videoHeight) return null;

    // 맨 첫 프레임은 검은 화면인 경우가 많아 조금 뒤(10% 지점, 최대 1.5초)를 쓴다.
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    video.currentTime = Math.min(1.5, Math.max(0, duration * 0.1));
    await waitFor(video, 'seeked', 20_000);

    const blob = await drawToWebp(video, video.videoWidth, video.videoHeight, 1280, 0.78);
    if (!blob) return null;
    return new File([blob], 'poster.webp', { type: 'image/webp' });
  } catch {
    return null;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

export type UploadResult = { url: string; poster?: string; warning?: string };
export type UploadStage = 'compress' | 'upload';

/**
 * 파일 하나를 업로드하고 공개 URL을 돌려준다.
 * 이미지는 압축 후 업로드, 영상은 원본 + 자동 생성 포스터를 함께 업로드한다.
 * 업로드 한도를 넘는 영상은 브라우저에서 자동 압축한다(video-compress.ts) — 몇 분 걸릴 수 있어
 * onStage 로 "압축 중/업로드 중"을 구분해 알린다.
 *
 * @param onProgress 0~1. 압축·업로드 각 단계에서 0부터 다시 시작한다(onStage 로 단계 구분).
 * @param onStage 단계 전환 알림 — 압축이 필요 없는 파일이면 'upload' 만 호출된다.
 */
export async function uploadMediaFile(
  raw: File,
  prefix: string,
  onProgress?: (ratio: number) => void,
  onStage?: (stage: UploadStage) => void
): Promise<UploadResult> {
  const isVideo = raw.type.startsWith('video/');

  // 포스터는 영상 압축·업로드와 무관하게 먼저 만들어 둔다(실패해도 영상 업로드는 계속).
  const posterFile = isVideo ? await captureVideoPoster(raw) : null;

  let file = raw;
  let warning: string | undefined;
  if (isVideo && raw.size > UPLOAD_LIMITS.video) {
    onStage?.('compress');
    const compressed = await compressVideoFile(raw, UPLOAD_LIMITS.video, onProgress);
    file = compressed.file;
    warning = compressed.warning;
  } else if (!isVideo) {
    file = await compressImage(raw);
  }

  onStage?.('upload');
  const url = await putFile(file, prefix, onProgress);
  if (!posterFile) return { url, warning };

  try {
    const poster = await putFile(posterFile, `${prefix}/poster`);
    return { url, poster, warning };
  } catch {
    return { url, warning }; // 포스터 실패는 치명적이지 않다 — 영상만으로 진행
  }
}

// ── 내부 헬퍼 ────────────────────────────────────────────────────────

async function putFile(
  file: File,
  prefix: string,
  onProgress?: (ratio: number) => void
): Promise<string> {
  const signed = await createUploadUrlAction({
    filename: file.name || 'upload.bin',
    prefix,
    contentType: file.type || 'application/octet-stream',
    size: file.size
  });
  if (signed.error || !signed.uploadUrl || !signed.publicUrl) {
    throw new Error(signed.error || '업로드 URL 발급에 실패했습니다.');
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signed.uploadUrl!);
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(readError(xhr) ?? `업로드 실패 (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('네트워크 오류로 업로드에 실패했습니다.'));
    xhr.onabort = () => reject(new Error('업로드가 중단되었습니다.'));
    xhr.send(file);
  });

  onProgress?.(1);
  return signed.publicUrl;
}

function readError(xhr: XMLHttpRequest): string | null {
  try {
    const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
    return body.message || body.error || null;
  } catch {
    return null;
  }
}

/** 이미지/영상 프레임을 지정 최대 크기로 줄여 WebP Blob 으로 인코딩. 미지원 브라우저면 null. */
function drawToWebp(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxDim: number,
  quality: number
): Promise<Blob | null> {
  const longest = Math.max(width, height);
  const scale = longest > maxDim ? maxDim / longest : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
}

/** 미디어 엘리먼트의 특정 이벤트를 기다린다(타임아웃·error 시 reject). */
function waitFor(el: HTMLMediaElement, event: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      el.removeEventListener(event, ok);
      el.removeEventListener('error', fail);
    };
    const ok = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error(`${event} 실패`));
    };
    const timer = setTimeout(fail, timeoutMs);
    el.addEventListener(event, ok, { once: true });
    el.addEventListener('error', fail, { once: true });
  });
}
