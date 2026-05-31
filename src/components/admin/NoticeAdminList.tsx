'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createNotice, deleteNotice } from '@/app/admin/notice-actions';
import { type NoticePost } from '@/lib/notice';

/** 어드민 공지 목록 — 새 공지 생성, 편집 링크, 삭제. */
export default function NoticeAdminList({
  posts,
  disabled = false
}: {
  posts: NoticePost[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function create() {
    setBusy(true);
    setMsg('');
    const res = await createNotice();
    setBusy(false);
    if (res.error) setMsg(res.error);
    else if (res.id) router.push(`/admin/notice/${res.id}`);
  }

  async function remove(id: string, title: string) {
    if (!confirm(`"${title || '제목 없음'}" 공지를 삭제할까요?`)) return;
    setBusy(true);
    setMsg('');
    const res = await deleteNotice(id);
    setBusy(false);
    if (res.error) setMsg(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={create}
          disabled={disabled || busy}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          + 새 공지 작성
        </button>
        {msg && <span className="text-sm text-red-600">{msg}</span>}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">아직 작성된 공지가 없습니다. “새 공지 작성”으로 시작하세요.</p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-24 shrink-0 text-sm text-muted">{p.date}</span>
              <span className="flex-1 truncate text-sm font-medium text-ink">
                {p.pinned && <span className="mr-1 text-brand">[고정]</span>}
                {p.title || '(제목 없음)'}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  p.published ? 'bg-brand/10 text-brand' : 'bg-line text-muted'
                }`}
              >
                {p.published ? '공개' : '숨김'}
              </span>
              <Link
                href={`/admin/notice/${p.id}`}
                className="shrink-0 rounded border border-line px-3 py-1 text-sm text-ink hover:border-brand"
              >
                편집
              </Link>
              <button
                type="button"
                onClick={() => remove(p.id, p.title)}
                disabled={disabled || busy}
                className="shrink-0 text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
