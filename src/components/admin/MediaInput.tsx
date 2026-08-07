'use client';

import { useState } from 'react';
import { uploadMediaFile, type UploadStage } from '@/lib/upload-client';
import { isVideoUrl } from '@/lib/media';

/**
 * 미디어 입력 — 파일 업로드(Supabase Storage 직행) 또는 URL 직접 입력.
 * 선택된 URL은 hidden input(name)으로 부모 <form> 에 실린다.
 *
 * 영상을 올리면 첫 프레임에서 포스터 이미지를 자동 생성해 함께 저장한다(posterName / onChange 2번째 인자).
 * 포스터가 있으면 공개 페이지가 영상을 내려받지 않고도 썸네일을 보여줄 수 있다.
 */
export default function MediaInput({
  name,
  posterName,
  prefix,
  value,
  posterValue,
  defaultUrl = '',
  defaultPoster = '',
  accept = 'image/*,video/*',
  disabled = false,
  onChange
}: {
  name?: string;
  /** 포스터 URL을 form 으로 함께 보낼 때의 hidden input name. */
  posterName?: string;
  prefix: string;
  /**
   * 제어(controlled) 모드 — 값을 부모 state 가 소유한다.
   * 블록/첨부 배열처럼 순서를 바꿀 수 있는 목록에서는 반드시 이 모드를 쓴다.
   * 비제어 모드는 내부 state 를 쓰기 때문에, 인덱스 key 로 렌더된 목록에서 항목을 위아래로
   * 옮기면 컴포넌트는 재사용되고 내부 state 만 남아 엉뚱한 미디어를 보여준다.
   */
  value?: string;
  posterValue?: string;
  defaultUrl?: string;
  defaultPoster?: string;
  accept?: string;
  disabled?: boolean;
  /** 동적 배열(갤러리·블록 에디터) 등 form 밖에서 값을 받을 때 사용. */
  onChange?: (url: string, meta?: { poster?: string }) => void;
}) {
  const controlled = value !== undefined;
  const [innerUrl, setInnerUrl] = useState(defaultUrl);
  const [innerPoster, setInnerPoster] = useState(defaultPoster);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<UploadStage>('upload');
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const url = controlled ? value : innerUrl;
  const poster = controlled ? posterValue ?? '' : innerPoster;

  const apply = (u: string, p: string) => {
    if (!controlled) {
      setInnerUrl(u);
      setInnerPoster(p);
    }
    onChange?.(u, { poster: p });
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const raw = input.files?.[0];
    if (!raw) return;
    setBusy(true);
    setStage('upload');
    setProgress(0);
    setErr('');
    setWarn('');
    try {
      const res = await uploadMediaFile(raw, prefix, setProgress, (s) => {
        setStage(s);
        setProgress(0); // 단계가 바뀌면 진행률도 0부터
      });
      apply(res.url, res.poster ?? '');
      if (res.warning) setWarn(res.warning);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : '업로드에 실패했습니다.');
    } finally {
      setBusy(false);
      setProgress(0);
      input.value = ''; // 같은 파일 재선택 허용
    }
  }

  const isVideo = isVideoUrl(url);
  const pct = Math.round(progress * 100);

  return (
    <div className="space-y-2">
      {name && <input type="hidden" name={name} value={url} />}
      {posterName && <input type="hidden" name={posterName} value={poster} />}

      {url && (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {isVideo ? (
            // 미리보기도 preload="none" — 어드민이 편집만 할 때 영상을 받지 않는다.
            <video
              src={url}
              poster={poster || undefined}
              className="h-40 w-full bg-black object-contain"
              preload="none"
              playsInline
              controls
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-40 w-full object-cover" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink hover:border-brand ${
            disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {busy ? `${stage === 'compress' ? '압축 중' : '업로드 중'}… ${pct}%` : '파일 선택'}
          <input
            type="file"
            accept={accept}
            onChange={handleFile}
            disabled={disabled || busy}
            className="hidden"
          />
        </label>
        {url && !busy && (
          <button
            type="button"
            onClick={() => apply('', '')}
            className="text-sm text-muted hover:text-ink"
          >
            제거
          </button>
        )}
        {isVideo && poster && !busy && (
          <span className="text-xs text-muted">썸네일 자동 생성됨</span>
        )}
      </div>

      {busy && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-brand transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <input
        type="text"
        value={url}
        onChange={(e) => apply(e.target.value, poster)}
        placeholder="또는 이미지/동영상 URL 직접 입력"
        disabled={disabled || busy}
        className="w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
      />

      {warn && <p className="text-sm text-amber-600">{warn}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
