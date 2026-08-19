'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import type { ScheduleItem, ScheduleStatus } from '@/lib/content';

import { useSaveStatus, SaveStatusBadge } from './save-status';
import ScheduleCalendarEditor, { KIND_OPTS, inputCls } from './ScheduleCalendarEditor';

type Item = { date: string; endDate?: string; program: string; status: ScheduleStatus };

/**
 * 일정 항목 편집 — 기본은 월 캘린더(날짜 클릭 → 패널에서 추가·수정),
 * 장기 일정 일괄 편집용 목록 보기 토글 제공. 두 보기는 같은 items 상태를 공유하고,
 * 모든 편집은 로컬에만 반영된 뒤 "일정표 저장"으로 schedule 키에 { items } 저장.
 */
export default function ScheduleForm({
  defaults,
  disabled = false
}: {
  defaults: ScheduleItem[];
  disabled?: boolean;
}) {
  const [items, setItems] = useState<Item[]>(defaults);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [dirty, setDirty] = useState(false);
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  // 모든 편집은 로컬 상태에만 반영 + 저장 안 한 변경 표시
  const mutate = (fn: (arr: Item[]) => Item[]) => {
    setItems(fn);
    setDirty(true);
  };
  const patch = (i: number, p: Partial<Item>) =>
    mutate((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const remove = (i: number) => mutate((arr) => arr.filter((_, idx) => idx !== i));
  const add = (it: Item) => mutate((arr) => [...arr, it]);
  const addEmpty = () => add({ date: '', program: '', status: 'tour' });

  async function save() {
    setSaving(true);
    // 날짜 필수. 내용(텍스트)은 예약 불가만 비워도 됨 → '휴무'로 저장.
    const clean = items
      .filter((it) => it.date && (it.program.trim() || it.status === 'blocked'))
      .map((it) => ({
        date: it.date,
        // 종료일이 시작일보다 뒤일 때만 기간으로 저장
        endDate: it.endDate && it.endDate > it.date ? it.endDate : undefined,
        program: it.program.trim() || '휴무',
        status: it.status
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const res = await saveContent('schedule', { items: clean });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      show(`저장되었습니다 (${clean.length}건).`);
    } else show(res.error ?? '저장 실패', 'err');
  }

  const toggleBtn = (v: 'calendar' | 'list', label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`rounded-button px-3 py-1.5 text-sm transition-colors ${
        view === v ? 'bg-brand font-semibold text-brand-contrast' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* 보기 전환 */}
      <div className="inline-flex gap-0.5 rounded-button border border-line bg-surface p-0.5">
        {toggleBtn('calendar', '캘린더 보기')}
        {toggleBtn('list', '목록 보기')}
      </div>

      {view === 'calendar' ? (
        <ScheduleCalendarEditor
          items={items}
          disabled={disabled}
          onPatch={patch}
          onRemove={remove}
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted">아직 등록된 일정이 없습니다. 아래에서 추가하세요.</p>
          )}

          <div className="space-y-2">
            {items.map((it, i) => {
              const kind = KIND_OPTS.find((o) => o.value === it.status) ?? KIND_OPTS[0];
              return (
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
                    title="장기 출장·기간 휴무 등은 종료일을 지정하세요(단일 날짜는 비워두세요)"
                  />
                  <input
                    value={it.program}
                    onChange={(e) => patch(i, { program: e.target.value })}
                    placeholder="달력에 그대로 표시됩니다 (예: 케라마 전세투어, 장기출장)"
                    disabled={disabled}
                    className={`${inputCls} min-w-[13rem] flex-1`}
                  />
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: kind.swatch }}
                    />
                    <select
                      aria-label="구분"
                      value={it.status}
                      onChange={(e) => patch(i, { status: e.target.value as ScheduleStatus })}
                      disabled={disabled}
                      className={`${inputCls} app-select app-select-light w-44`}
                    >
                      {KIND_OPTS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={disabled}
                    className="text-sm text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addEmpty}
            disabled={disabled}
            className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-50"
          >
            + 일정 추가
          </button>
        </div>
      )}

      {/* 저장 — 두 보기 공용 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '일정표 저장'}
        </button>
        {dirty && <span className="text-sm text-amber-600">저장되지 않은 변경</span>}
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
