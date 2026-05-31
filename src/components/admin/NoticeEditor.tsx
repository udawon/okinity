'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveNotice } from '@/app/admin/notice-actions';
import { type NoticePost } from '@/lib/notice';

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 공지 작성/편집 폼 — 제목·날짜·공개·고정·본문. */
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
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setSaving(true);
    setMsg('');
    const res = await saveNotice({ ...post, title, date, published, pinned, body });
    setSaving(false);
    if (res.error) setMsg(res.error);
    else {
      setMsg('저장되었습니다.');
      router.refresh();
    }
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '공지 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
