'use client';

import { useState } from 'react';
import { useSaveStatus, SaveStatusBadge } from './save-status';
import { useRouter } from 'next/navigation';
import { saveNotice } from '@/app/admin/notice-actions';
import { type NoticePost, type NoticeMedia } from '@/lib/notice';
import { VIDEO_UPLOAD_HINT } from '@/lib/upload-client';
import MediaInput from './MediaInput';
import PreviewLink from './PreviewLink';

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';
const ctrlBtn =
  'rounded border border-line px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30';

/** 공지 작성/편집 폼 — 제목·날짜·공개·고정·본문 + 사진/영상 첨부. */
export default function NoticeEditor({
  post,
  disabled = false
}: {
  post: NoticePost;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [date, setDate] = useState(post.date);
  const [published, setPublished] = useState(post.published);
  const [pinned, setPinned] = useState(post.pinned);
  const [body, setBody] = useState(post.body);
  const [media, setMedia] = useState<NoticeMedia[]>(post.media ?? []);
  const [saving, setSaving] = useState(false);
  const { status, show } = useSaveStatus();

  const patchMedia = (i: number, p: Partial<NoticeMedia>) =>
    setMedia((cur) => cur.map((m, idx) => (idx === i ? { ...m, ...p } : m)));
  const removeMedia = (i: number) => setMedia((cur) => cur.filter((_, idx) => idx !== i));
  const moveMedia = (i: number, dir: -1 | 1) =>
    setMedia((cur) => {
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const addMedia = (type: NoticeMedia['type']) =>
    setMedia((cur) => [...cur, { type, url: '', poster: '', caption: '' }]);

  /** 저장 성공 여부를 반환한다 — 미리보기가 저장 성공했을 때만 새 탭을 열기 위해. */
  async function save(): Promise<boolean> {
    setSaving(true);
    const res = await saveNotice({ ...post, title, date, published, pinned, body, media });
    setSaving(false);
    if (res.error) {
      show(res.error, 'err');
      return false;
    }
    show('저장되었습니다.');
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
        <div>
          <label className={labelCls} htmlFor="notice-title">
            제목
          </label>
          <input
            id="notice-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목"
            disabled={disabled}
            className={inputCls}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-5">
          <div>
            <label className={labelCls} htmlFor="notice-date">
              날짜
            </label>
            <input
              id="notice-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={disabled}
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4"
            />
            공개 (체크 해제 시 숨김/초안)
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4"
            />
            상단 고정
          </label>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
        <label className={labelCls} htmlFor="notice-body">
          본문
        </label>
        <textarea
          id="notice-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="공지 내용 (줄바꿈 가능)"
          rows={10}
          disabled={disabled}
          className={`${inputCls} resize-y !rounded-card`}
        />
      </div>

      {/* 첨부 사진·영상 — 본문 아래에 순서대로 표시된다. */}
      <div className="space-y-3 rounded-card border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">사진 · 영상 첨부</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addMedia('image')}
              disabled={disabled}
              className={`${ctrlBtn} px-3 py-1.5 text-sm`}
            >
              + 사진
            </button>
            <button
              type="button"
              onClick={() => addMedia('video')}
              disabled={disabled}
              className={`${ctrlBtn} px-3 py-1.5 text-sm`}
            >
              + 영상
            </button>
          </div>
        </div>

        {media.length === 0 ? (
          <p className="text-sm text-muted">
            첨부가 없습니다. 위 버튼으로 사진이나 영상을 추가하세요.
          </p>
        ) : (
          media.map((m, i) => (
            <div key={i} className="rounded-card border border-line bg-bg/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {m.type === 'video' ? '영상' : '사진'} #{i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveMedia(i, -1)}
                    disabled={disabled || i === 0}
                    className={ctrlBtn}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMedia(i, 1)}
                    disabled={disabled || i === media.length - 1}
                    className={ctrlBtn}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    disabled={disabled}
                    className="rounded border border-line px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <MediaInput
                  prefix="notice"
                  accept={m.type === 'video' ? 'video/*' : 'image/*'}
                  value={m.url}
                  posterValue={m.poster ?? ''}
                  disabled={disabled}
                  onChange={(url, meta) => patchMedia(i, { url, poster: meta?.poster ?? '' })}
                />
                <input
                  value={m.caption ?? ''}
                  onChange={(e) => patchMedia(i, { caption: e.target.value })}
                  placeholder={m.type === 'video' ? '영상 설명 (선택)' : '사진 설명 (선택)'}
                  disabled={disabled}
                  className={`${inputCls} !mt-0`}
                />
                {m.type === 'video' && <p className="text-xs text-muted">{VIDEO_UPLOAD_HINT}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '공지 저장'}
        </button>
        <PreviewLink
          href={`/ko/notice/${post.id}`}
          onBeforeOpen={save}
          disabled={disabled || saving}
        />
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
