'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import { HOME_CONTENT_KEYS, type TourCardCopy } from '@/lib/home-content';

const inputCls =
  'w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted disabled:opacity-50';
// 장문(여러 줄)은 알약형이 아닌 카드형 라운드 + 넉넉한 줄간격/높이.
const textareaCls =
  'w-full resize-y rounded-card border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted disabled:opacity-50';

/**
 * 투어 카드 텍스트 편집 — 섹션 제목·소개 + 카테고리별(스노클링·다이빙·PADI·낚시) 제목·태그라인·설명.
 * home_tour_copy 키에 { sectionTitle, sectionIntro, cards: { [id]: {title,tagline,desc} } } 저장.
 * (카드 이미지는 위 '투어 카테고리 이미지'에서, 하위 투어명·상세는 '투어 상세'에서 관리)
 */
export default function TourCopyForm({
  categories,
  defaults,
  defaultTitle,
  defaultIntro,
  disabled = false
}: {
  categories: { id: string; label: string }[];
  defaults: Record<string, TourCardCopy>;
  defaultTitle?: string;
  defaultIntro?: string;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [intro, setIntro] = useState(defaultIntro ?? '');
  const [cards, setCards] = useState<Record<string, TourCardCopy>>(defaults);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = (id: string, p: Partial<TourCardCopy>) =>
    setCards((c) => ({ ...c, [id]: { ...(c[id] ?? { title: '', tagline: '', desc: '' }), ...p } }));

  async function save() {
    setSaving(true);
    setMsg('');
    const cleaned: Record<string, TourCardCopy> = {};
    for (const { id } of categories) {
      const c = cards[id];
      if (c) cleaned[id] = { title: c.title.trim(), tagline: c.tagline.trim(), desc: c.desc.trim() };
    }
    const res = await saveContent(HOME_CONTENT_KEYS.tourCopy, {
      sectionTitle: title.trim(),
      sectionIntro: intro.trim(),
      cards: cleaned
    });
    setSaving(false);
    setMsg(res.ok ? '저장되었습니다.' : (res.error ?? '저장 실패'));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">섹션 제목 (선택)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="비우면 기본: 네 가지 방법으로 만나는 바다"
            disabled={disabled}
            className={`mt-1 ${inputCls}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">섹션 소개 (선택)</label>
          <input
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="비우면 기본 소개 문구"
            disabled={disabled}
            className={`mt-1 ${inputCls}`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map(({ id, label }) => {
          const c = cards[id] ?? { title: '', tagline: '', desc: '' };
          return (
            <div key={id} className="space-y-2 rounded-card border border-line bg-bg/40 p-3">
              <span className="text-sm font-medium text-ink">{label}</span>
              <input
                value={c.title}
                onChange={(e) => patch(id, { title: e.target.value })}
                placeholder="카테고리명"
                disabled={disabled}
                className={inputCls}
              />
              <input
                value={c.tagline}
                onChange={(e) => patch(id, { tagline: e.target.value })}
                placeholder="한 줄 태그라인"
                disabled={disabled}
                className={inputCls}
              />
              <textarea
                value={c.desc}
                onChange={(e) => patch(id, { desc: e.target.value })}
                placeholder="카드 설명"
                rows={4}
                disabled={disabled}
                className={textareaCls}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '투어 카드 텍스트 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
      <p className="text-xs text-muted">빈 칸은 기본 문구가 사용됩니다. (en/日은 번역본 표시)</p>
    </div>
  );
}
