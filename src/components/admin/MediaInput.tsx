'use client';

import { useState } from 'react';
import { uploadMediaAction } from '@/app/admin/content-actions';

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

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
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    const fd = new FormData();
    fd.set('file', file);
    fd.set('prefix', prefix);
    const res = await uploadMediaAction({}, fd);
    setBusy(false);
    if (res.error) setErr(res.error);
    else if (res.url) setUrl(res.url);
    e.target.value = ''; // 같은 파일 재선택 허용
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
