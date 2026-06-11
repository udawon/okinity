'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import type { ScheduleItem } from '@/lib/content';
import { useSaveStatus, SaveStatusBadge } from './save-status';

type Status = ScheduleItem['status'];
type Item = { date: string; endDate?: string; program: string; status: Status };

// 예약 가능=기본값, 예약 많음=확정 2건+ 자동 → 수동 옵션은 휴무·오전 가능·오후 가능만.
const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: 'closed', label: '휴무' },
  { value: 'morning', label: '오전 가능' },
  { value: 'afternoon', label: '오후 가능' }
];
const STATUS_LABEL: Record<Status, string> = {
  available: '예약 가능',
  full: '예약 많음',
  closed: '휴무',
  booked: '예약됨',
  morning: '오전 가능',
  afternoon: '오후 가능'
};

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
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<Item>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () =>
    setItems((arr) => [...arr, { date: '', program: '', status: 'closed' }]);

  async function save() {
    setSaving(true);
    // 날짜 필수. 휴무·오전/오후 가능은 프로그램명 없이도 저장(라벨 자동).
    const noProgram = (s: Status) => s === 'closed' || s === 'morning' || s === 'afternoon';
    const clean = items
      .filter((it) => it.date && (it.program.trim() || noProgram(it.status)))
      .map((it) => ({
        date: it.date,
        // 종료일이 시작일보다 뒤일 때만 기간으로 저장
        endDate: it.endDate && it.endDate > it.date ? it.endDate : undefined,
        program: it.program.trim() || (it.status === 'closed' ? '휴무' : ''),
        status: it.status
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const res = await saveContent('schedule', { items: clean });
    setSaving(false);
    if (res.ok) show(`저장되었습니다 (${clean.length}건).`);
    else show(res.error ?? '저장 실패', 'err');
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
              aria-label="시작일"
              value={it.date.slice(0, 10)}
              onChange={(e) => patch(i, { date: e.target.value })}
              disabled={disabled}
              className={`${inputCls} w-36`}
            />
            <span className="text-sm text-muted">~</span>
            <input
              type="date"
              aria-label="종료일(선택)"
              min={it.date.slice(0, 10) || undefined}
              value={it.endDate?.slice(0, 10) ?? ''}
              onChange={(e) => patch(i, { endDate: e.target.value })}
              disabled={disabled}
              className={`${inputCls} w-36`}
              title="기간 휴무 등은 종료일을 지정하세요(단일 날짜는 비워두세요)"
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
              className={`${inputCls} app-select app-select-light w-32`}
            >
              {/* 기존 항목 상태(예약가능/예약많음 등)가 옵션에 없으면 보존용으로 추가 */}
              {!STATUS_OPTS.some((o) => o.value === it.status) && (
                <option value={it.status}>{STATUS_LABEL[it.status]}</option>
              )}
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
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
