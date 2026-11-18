'use client';

import { useMemo, useState } from 'react';
import { saveGeoChecks } from '@/app/admin/geo-actions';
import { GEO_PLATFORM_GUIDE, GEO_PLATFORMS, GEO_QUESTIONS, type GeoCheck, type GeoPlatform } from '@/lib/geo-checks';
import { safeAction } from '@/lib/safe-action';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const inputCls =
  'w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

type Row = {
  question: string;
  mentioned: boolean;
  cited: boolean;
  recommended: boolean;
  citedUrl: string;
  competitors: string;
  summary: string;
};

const blankRow = (question: string): Row => ({
  question,
  mentioned: false,
  cited: false,
  recommended: false,
  citedUrl: '',
  competitors: '',
  summary: ''
});

/** 'okinity.com/ko' 처럼 주소만 붙여넣어도 저장되게 — 앞에 https:// 를 붙인다. */
function withScheme(url: string): string {
  const v = url.trim();
  return v && !/^https?:\/\//i.test(v) ? `https://${v}` : v;
}

/** 그 날짜·플랫폼에 이미 저장한 기록이 있으면 불러와 고칠 수 있게. 고정 질문 10개 + 기타 질문 1칸. */
function rowsFor(checks: GeoCheck[], checkedOn: string, platform: string): { rows: Row[]; extra: Row; existing: number } {
  const saved = checks.filter((c) => c.checkedOn === checkedOn && c.platform === platform);
  const toRow = (c: GeoCheck): Row => ({
    question: c.question,
    mentioned: c.mentioned,
    cited: c.cited,
    recommended: c.recommended,
    citedUrl: c.citedUrl ?? '',
    competitors: c.competitors ?? '',
    summary: c.summary ?? ''
  });
  const fixed = new Set<string>(GEO_QUESTIONS);
  const other = saved.find((c) => !fixed.has(c.question));
  return {
    rows: GEO_QUESTIONS.map((q) => {
      const c = saved.find((s) => s.question === q);
      return c ? toRow(c) : blankRow(q);
    }),
    extra: other ? toRow(other) : blankRow(''),
    existing: saved.length
  };
}

/**
 * AI 답변 기록 입력 — 날짜·플랫폼을 고르고 질문 10개의 언급·출처·추천을 체크해 한 번에 저장.
 * 같은 날짜·플랫폼을 다시 저장하면 덮어쓴다(lib/geo-store replaceGeoChecks).
 */
export default function GeoCheckForm({ checks, today, disabled }: { checks: GeoCheck[]; today: string; disabled?: boolean }) {
  const [checkedOn, setCheckedOn] = useState(today);
  const [platform, setPlatform] = useState<GeoPlatform>(GEO_PLATFORMS[0]);
  const guide = GEO_PLATFORM_GUIDE[platform];
  const initial = useMemo(() => rowsFor(checks, checkedOn, platform), [checks, checkedOn, platform]);
  // 날짜·플랫폼별로 입력 중인 내용을 따로 보관 — 저장 전에 다른 플랫폼을 눌러도 사라지지 않게
  const [drafts, setDrafts] = useState<Record<string, { rows: Row[]; extra: Row }>>({});
  const key = `${checkedOn}|${platform}`;
  const rows = drafts[key]?.rows ?? initial.rows;
  const extra = drafts[key]?.extra ?? initial.extra;
  const unsaved = (p: string) => Boolean(drafts[`${checkedOn}|${p}`]);
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const setRow = (i: number, patch: Partial<Row>) =>
    setDrafts((d) => ({ ...d, [key]: { rows: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)), extra } }));
  const setExtra = (patch: Partial<Row>) => setDrafts((d) => ({ ...d, [key]: { rows, extra: { ...extra, ...patch } } }));

  async function copy(i: number, q: string) {
    try {
      await navigator.clipboard.writeText(q);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // 클립보드 차단 — 직접 선택해 복사
    }
  }

  async function save() {
    const all = extra.question.trim() ? [...rows, extra] : rows;
    const payload = all.map((r) => ({ ...r, citedUrl: r.cited ? withScheme(r.citedUrl) : '' }));
    setSaving(true);
    const res = await safeAction(() => saveGeoChecks(checkedOn, platform, payload));
    setSaving(false);
    if (res.ok) {
      setDrafts((d) => {
        const { [key]: _saved, ...rest } = d;
        return rest;
      });
      show(`${platform} ${res.saved}개 질문을 저장했습니다.`);
    } else show(res.error ?? '저장 실패', 'err');
  }

  const box = (checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );

  const fields = (r: Row, set: (p: Partial<Row>) => void) => (
    <>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {box(r.mentioned, (v) => set({ mentioned: v }), '언급')}
        {box(r.cited, (v) => set({ cited: v }), '출처(링크)')}
        {box(r.recommended, (v) => set({ recommended: v }), '추천')}
      </div>
      <div className={`mt-2 grid gap-2 ${r.cited ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {/* 출처 주소는 '출처'를 체크했을 때만(입력 칸 줄이기). 체크를 풀면 저장 때 비운다. */}
        {r.cited && (
          <input
            className={inputCls}
            value={r.citedUrl}
            onChange={(e) => set({ citedUrl: e.target.value })}
            placeholder="출처로 나온 주소 (https://…)"
            inputMode="url"
            maxLength={480}
          />
        )}
        <input
          className={inputCls}
          value={r.competitors}
          onChange={(e) => set({ competitors: e.target.value })}
          placeholder="함께 나온 업체"
          maxLength={300}
        />
        <input
          className={inputCls}
          value={r.summary}
          onChange={(e) => set({ summary: e.target.value })}
          placeholder="메모 (틀린 정보 등)"
          maxLength={2000}
        />
      </div>
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted">
          날짜
          <input
            type="date"
            className={`${inputCls} mt-1 block w-auto`}
            value={checkedOn}
            max={today}
            onChange={(e) => e.target.value && setCheckedOn(e.target.value)}
          />
        </label>
        <div className="text-sm text-muted">
          플랫폼
          <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="플랫폼">
            {GEO_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={platform === p}
                onClick={() => setPlatform(p)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  platform === p ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink'
                }`}
              >
                {p}
                {unsaved(p) && platform !== p && <span className="ml-1 text-amber-600" title="저장 안 한 입력 있음">●</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 고른 플랫폼에서 묻는 방법 — 매뉴얼과 같은 내용(lib/geo-checks GEO_PLATFORM_GUIDE) */}
      <div className="mt-3 rounded-card border border-sky-200 bg-sky-50/60 p-3 text-[13px] text-ink">
        <p className="font-semibold">
          {platform}에서 묻는 법 <span className="font-normal text-muted">· {guide.where}</span>
        </p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
          {guide.steps.map((s) => (
            <li key={s} className="leading-relaxed">
              {s}
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-2 text-xs text-muted">
        {initial.existing > 0
          ? `이 날짜에 저장한 ${platform} 기록 ${initial.existing}개를 불러왔어요. 고친 뒤 저장하면 덮어씁니다.`
          : '새 기록입니다. 체크하지 않은 질문은 "언급 없음"으로 저장돼요.'}
        {Object.keys(drafts).some((k) => k !== key) && ' 주황 점(●)은 저장하지 않은 플랫폼입니다.'}
      </p>

      <ol className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <li key={r.question} className="rounded-card border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                {i + 1}. {r.question}
              </p>
              <button
                type="button"
                onClick={() => copy(i, r.question)}
                className="shrink-0 rounded-button border border-line px-2 py-1 text-xs text-muted"
              >
                {copied === i ? '복사됨' : '질문 복사'}
              </button>
            </div>
            {fields(r, (p) => setRow(i, p))}
          </li>
        ))}
        <li className="rounded-card border border-dashed border-line p-3">
          <input
            className={inputCls}
            value={extra.question}
            onChange={(e) => setExtra({ question: e.target.value })}
            placeholder="기타 질문 (선택 — 비워 두면 저장하지 않음)"
            maxLength={200}
          />
          {extra.question.trim() && fields(extra, setExtra)}
        </li>
      </ol>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? '저장 중…' : `${platform} 기록 저장`}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
