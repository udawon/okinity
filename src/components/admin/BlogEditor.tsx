'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveBlogPost } from '@/app/admin/blog-actions';
import { type BlogPost, type BlogBlock } from '@/lib/blog';
import MediaInput from './MediaInput';

const inputCls =
  'w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';
const ctrlBtn = 'rounded border border-line px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30';

/** 블로그 글 작성/편집 — 제목·대표이미지·날짜·공개토글 + 텍스트/이미지 블록 에디터. */
export default function BlogEditor({
  post: initial,
  disabled = false
}: {
  post: BlogPost;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost>(initial);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (p: Partial<BlogPost>) => setPost((cur) => ({ ...cur, ...p }));

  const blocks = post.blocks;
  const setBlocks = (next: BlogBlock[]) => set({ blocks: next });
  const patchBlock = (i: number, p: Partial<BlogBlock>) =>
    setBlocks(blocks.map((b, idx) => (idx === i ? ({ ...b, ...p } as BlogBlock) : b)));
  const removeBlock = (i: number) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };
  const addText = () => setBlocks([...blocks, { type: 'text', value: '' }]);
  const addImage = () => setBlocks([...blocks, { type: 'image', url: '', caption: '' }]);

  async function save() {
    setSaving(true);
    setMsg('');
    const res = await saveBlogPost(post);
    setSaving(false);
    if (res.error) setMsg(res.error);
    else {
      setMsg('저장되었습니다.');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* 메타 */}
      <div className="space-y-4 rounded-card border border-line bg-surface p-4 sm:p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">제목</label>
          <input
            value={post.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="글 제목"
            disabled={disabled}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">대표 이미지 (썸네일)</label>
          <MediaInput
            prefix="blog"
            accept="image/*"
            defaultUrl={post.thumbnail}
            disabled={disabled}
            onChange={(url) => set({ thumbnail: url })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">날짜</label>
            <input
              type="date"
              value={post.date.slice(0, 10)}
              onChange={(e) => set({ date: e.target.value })}
              disabled={disabled}
              className={`${inputCls} w-44`}
            />
          </div>
          <label className="flex items-center gap-2 pt-5 text-sm text-ink">
            <input
              type="checkbox"
              checked={post.published}
              onChange={(e) => set({ published: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4"
            />
            공개 (체크 해제 시 숨김/초안)
          </label>
        </div>
      </div>

      {/* 본문 블록 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">본문</h3>
        {blocks.length === 0 && (
          <p className="text-sm text-muted">아래 버튼으로 텍스트·이미지 블록을 추가하세요.</p>
        )}

        {blocks.map((b, i) => (
          <div key={i} className="rounded-card border border-line bg-bg/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {b.type === 'text' ? '텍스트' : '이미지'} #{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveBlock(i, -1)} disabled={disabled || i === 0} className={ctrlBtn}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(i, 1)}
                  disabled={disabled || i === blocks.length - 1}
                  className={ctrlBtn}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  disabled={disabled}
                  className="rounded border border-line px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>

            {b.type === 'text' ? (
              <textarea
                value={b.value}
                onChange={(e) => patchBlock(i, { value: e.target.value })}
                placeholder="본문 텍스트 (줄바꿈 가능)"
                rows={5}
                disabled={disabled}
                className={`${inputCls} resize-y`}
              />
            ) : (
              <div className="space-y-2">
                <MediaInput
                  prefix="blog"
                  accept="image/*"
                  defaultUrl={b.url}
                  disabled={disabled}
                  onChange={(url) => patchBlock(i, { url })}
                />
                <input
                  value={b.caption ?? ''}
                  onChange={(e) => patchBlock(i, { caption: e.target.value })}
                  placeholder="이미지 설명 (선택)"
                  disabled={disabled}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addText} disabled={disabled} className={`${ctrlBtn} px-4 py-2 text-sm`}>
            + 텍스트
          </button>
          <button type="button" onClick={addImage} disabled={disabled} className={`${ctrlBtn} px-4 py-2 text-sm`}>
            + 이미지
          </button>
        </div>
      </div>

      {/* 저장 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '글 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
