'use client';

import { useState } from 'react';
import { uploadMediaAction } from '@/app/admin/content-actions';

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

/**
 * 업로드 전 이미지 자동 축소·압축(canvas, 무의존).
 * 긴 변을 maxDim 으로 제한하고 WebP 로 인코딩 → 화질 손실은 최소화하면서 용량을 크게 줄인다.
 * (WebP 는 동일 화질에서 JPEG보다 25~35% 작고 최신 브라우저 대부분 지원)
 * 가볍게 저장해 그대로 서빙하므로, 사진이 많아져도 서버 변환 비용이 들지 않는다.
 * GIF/SVG·비이미지(동영상)·이미 작은 WebP 는 원본 그대로 반환.
 */
async function compressImage(file: File, maxDim = 2000, quality = 0.82): Promise<File> {
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
    const longest = Math.max(img.width, img.height);
    const scale = longest > maxDim ? maxDim / longest : 1;
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    // WebP 우선. 미지원 브라우저면 toBlob 이 null → 원본 폴백.
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file; // 압축 이득 없으면 원본 유지
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file; // 압축 실패 시 원본으로 폴백
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 미디어 입력 — 파일 업로드(Supabase Storage) 또는 URL 직접 입력.
 * 선택된 URL은 hidden input(name)으로 부모 <form> 에 실린다.
 */
export default function MediaInput({
  name,
  prefix,
  defaultUrl = '',
  accept = 'image/*,video/*',
  disabled = false,
  onChange
}: {
  name?: string;
  prefix: string;
  defaultUrl?: string;
  accept?: string;
  disabled?: boolean;
  /** 동적 배열(갤러리) 등 form 밖에서 값을 받을 때 사용. */
  onChange?: (url: string) => void;
}) {
  const [url, setUrlState] = useState(defaultUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const setUrl = (u: string) => {
    setUrlState(u);
    onChange?.(u);
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const raw = input.files?.[0];
    if (!raw) return;
    setBusy(true);
    setErr('');
    try {
      const file = await compressImage(raw); // 이미지면 자동 축소·압축
      const fd = new FormData();
      fd.set('file', file);
      fd.set('prefix', prefix);
      const res = await uploadMediaAction({}, fd);
      if (res.error) setErr(res.error);
      else if (res.url) setUrl(res.url);
    } catch {
      // Server Action 본문 한도 초과·네트워크 오류 등으로 액션 자체가 실패한 경우
      setErr('업로드에 실패했습니다. 파일이 너무 크거나 네트워크 오류일 수 있습니다.');
    } finally {
      setBusy(false); // 성공·실패와 무관하게 항상 "업로드 중…" 해제
      input.value = ''; // 같은 파일 재선택 허용
    }
  }

  const isVideo = VIDEO_RE.test(url);

  return (
    <div className="space-y-2">
      {name && <input type="hidden" name={name} value={url} />}

      {url && (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {isVideo ? (
            <video src={url} className="h-40 w-full object-cover" muted controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-40 w-full object-cover" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink hover:border-brand">
          {busy ? '업로드 중…' : '파일 선택'}
          <input
            type="file"
            accept={accept}
            onChange={handleFile}
            disabled={disabled || busy}
            className="hidden"
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => setUrl('')}
            className="text-sm text-muted hover:text-ink"
          >
            제거
          </button>
        )}
      </div>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="또는 이미지/동영상 URL 직접 입력"
        disabled={disabled}
        className="w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
      />

      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
