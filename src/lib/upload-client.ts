'use client';

import { createUploadUrlAction } from '@/app/admin/content-actions';
import { compressVideo } from './video-compress';

/**
 * 어드민 미디어 업로드 — 브라우저에서 Supabase Storage 로 직접 전송한다.
 *
 * 설계 목적은 두 가지다.
 *  1) 업로드 가능 용량: 파일 본문이 Vercel 서버리스 함수를 거치지 않으므로 요청 본문
 *     한도(4.5MB)에 걸리지 않는다. 영상 업로드가 가능해지는 전제 조건.
 *  2) 방문자 전송량·저장 용량: 올리는 시점에 이미지는 축소·WebP 압축하고, 영상은 1080p·30fps·H.264 로
 *     줄인 뒤(lib/video-compress) 첫 프레임을 뽑아 포스터 이미지를 함께 만든다. 공개 페이지는 영상
 *     바이트를 받지 않고도 썸네일을 보여줄 수 있다(재생 버튼을 눌러야 비로소 영상이 내려간다).
 */

/** 어드민 영상 업로드 안내 — 방문자 전송량을 고려한 권장 사양. */
export const VIDEO_UPLOAD_HINT =
  '4K 영상도 그대로 고르세요 — 올리기 전에 자동으로 1080p로 줄입니다(10초 영상 약 5MB, 줄이는 데 몇 초~수십 초). 줄인 뒤 최대 50MB · 1~2분 이내 권장. 첫 프레임으로 썸네일이 자동 생성됩니다.';

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

export type UploadResult = { url: string; poster?: string; note?: string };

/** 진행 단계 — 영상은 줄이기(compress) 후 전송(upload). */
export type UploadStage = 'compress' | 'upload';

/**
 * 파일 하나를 업로드하고 공개 URL을 돌려준다.
 * 이미지는 압축 후 업로드, 영상은 줄인 뒤(못 줄이면 원본) + 자동 생성 포스터를 함께 업로드한다.
 *
 * @param onProgress 0~1 과 단계. 영상은 줄이기 → 전송 순서로 각각 0~1 을 보고한다.
 * @returns note — 영상을 줄이지 못하고 원본을 올렸을 때 그 이유(어드민 안내용).
 */
export async function uploadMediaFile(
  raw: File,
  prefix: string,
  onProgress?: (ratio: number, stage: UploadStage) => void
): Promise<UploadResult> {
  const isVideo = raw.type.startsWith('video/');
  const shrunk = isVideo
    ? await compressVideo(raw, (r) => onProgress?.(r, 'compress'))
    : { file: await compressImage(raw), note: undefined };
  const file = shrunk.file;
  const note = shrunk.note;

  // 포스터는 영상 업로드와 무관하게 먼저 만들어 둔다(실패해도 영상 업로드는 계속).
  // 줄인 H.264 파일에서 뽑는다 — HEVC 원본은 브라우저에 따라 프레임을 못 꺼낸다.
  const posterFile = isVideo ? await captureVideoPoster(file) : null;

  const url = await putFile(file, prefix, (r) => onProgress?.(r, 'upload'));
  if (!posterFile) return { url, note };

  try {
    const poster = await putFile(posterFile, `${prefix}/poster`);
    return { url, poster, note };
  } catch {
    return { url, note }; // 포스터 실패는 치명적이지 않다 — 영상만으로 진행
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
