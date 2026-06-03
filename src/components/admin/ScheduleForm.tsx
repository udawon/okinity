'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import type { ScheduleItem } from '@/lib/content';

type Status = ScheduleItem['status'];
type Item = { date: string; program: string; status: Status };

const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: 'available', label: '예약 가능' },
  { value: 'full', label: '예약 많음' },
  { value: 'closed', label: '휴무' }
];

const inputCls =
  'rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 일정 항목 배열 편집 — 날짜(ISO)·프로그램·상태. schedule 키에 { items } 저장. */
export default function ScheduleForm({
  defaults,
  disabled = false
}: {
  defaults: Item[];
  disabled?: boolean;
}) {
  const [items, setItems] = useState<Item[]>(defaults);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<Item>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () =>
    setItems((arr) => [...arr, { date: '', program: '', status: 'available' }]);

  async function save() {
    setSaving(true);
    setMsg('');
    // 날짜 필수. 휴무는 프로그램명 없이도 저장(자동 '휴무'). 그 외는 프로그램명 필요.
    const clean = items
      .filter((it) => it.date && (it.program.trim() || it.status === 'closed'))
      .map((it) => ({ ...it, program: it.program.trim() || (it.status === 'closed' ? '휴무' : '') }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const res = await saveContent('schedule', { items: clean });
    setSaving(false);
    setMsg(res.ok ? `저장되었습니다 (${clean.length}건).` : (res.error ?? '저장 실패'));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-muted">아직 등록된 일정이 없습니다. 아래에서 추가하세요.</p>
      )}

      <div className="space-y-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-bg/40 p-3"
          >
            <input
              type="date"
              value={it.date.slice(0, 10)}
              onChange={(e) => patch(i, { date: e.target.value })}
              disabled={disabled}
              className={`${inputCls} w-40`}
            />
            <input
              value={it.program}
              onChange={(e) => patch(i, { program: e.target.value })}
              placeholder="프로그램명 (휴무는 비워도 됨)"
              disabled={disabled}
              className={`${inputCls} min-w-[10rem] flex-1`}
            />
            <select
              value={it.status}
              onChange={(e) => patch(i, { status: e.target.value as Status })}
              disabled={disabled}
              className={`${inputCls} w-32`}
            >
              {STATUS_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              className="text-sm text-red-600 hover:underline"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-50"
        >
          + 일정 추가
        </button>
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '일정표 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
