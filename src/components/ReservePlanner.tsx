'use client';

import { useState, type FormEvent } from 'react';
import { Link } from '@/i18n/routing';
import ScheduleCalendar from './ScheduleCalendar';
import type { ScheduleItem } from '@/lib/content';

type Status = ScheduleItem['status'];
type Selected = { key: string; events: ScheduleItem[] } | null;
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const inputCls =
  'w-full rounded-button border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#5fd6e2] focus:outline-none focus:ring-2 focus:ring-[#5fd6e2]/25';
const labelCls = 'block text-xs font-medium uppercase tracking-wider text-white/55';

/**
 * 예약 플래너 — 일정표(좌)와 예약 폼(우)을 하나로 통합.
 * 예약가능 날짜를 클릭하면 우측 패널에 날짜·프로그램이 자동 채워진 예약 폼이 뜬다.
 */
export default function ReservePlanner({
  items,
  locale,
  statusLabel,
  emptyLabel
}: {
  items: ScheduleItem[];
  locale: string;
  statusLabel: Record<Status, string>;
  emptyLabel: string;
}) {
  const [selected, setSelected] = useState<Selected>(null);
  const [program, setProgram] = useState('');
  const [submit, setSubmit] = useState<SubmitState>('idle');

  const availPrograms = selected
    ? selected.events.filter((e) => e.status === 'available').map((e) => e.program)
    : [];

  function handleSelect(key: string, events: ScheduleItem[]) {
    setSelected({ key, events });
    const first = events.find((e) => e.status === 'available');
    setProgram(first?.program ?? '');
    setSubmit('idle');
  }

  const dateLong = selected
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(new Date(selected.key))
    : '';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setSubmit('submitting');
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      product: program,
      date: selected.key,
      people: fd.get('people'),
      name: fd.get('name'),
      contact: fd.get('contact'),
      message: fd.get('message'),
      company: fd.get('company') // 허니팟
    };
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('failed');
      setSubmit('success');
      form.reset();
    } catch {
      setSubmit('error');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(330px,400px)]">
      {/* 좌: 일정표 (선택 가능) */}
      <div className="rounded-card border border-white/10 bg-[#06151d]/60 p-5 backdrop-blur-md sm:p-7">
        <ScheduleCalendar
          items={items}
          locale={locale}
          statusLabel={statusLabel}
          emptyLabel={emptyLabel}
          selectable
          selectedKey={selected?.key ?? null}
          onSelectDate={handleSelect}
        />
      </div>

      {/* 우: 예약 패널 */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-card border border-white/10 bg-gradient-to-b from-[#0e3848]/85 to-[#06151d]/85 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {!selected ? (
            /* 빈 상태 — 안내 */
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-[#5fd6e2]/30 bg-[#5fd6e2]/10 text-2xl">
                🗓️
              </div>
              <p className="mt-5 font-serif text-xl text-white">날짜를 선택하세요</p>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/60">
                왼쪽 달력에서 <span className="text-[#5fd6e2]">예약 가능한 날짜</span>를 누르면
                여기에서 바로 예약을 시작할 수 있어요.
              </p>
            </div>
          ) : submit === 'success' ? (
            /* 완료 */
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-[#5fd6e2]/40 bg-[#5fd6e2]/15 text-2xl">
                ✓
              </div>
              <p className="mt-5 font-serif text-xl text-white">문의가 접수되었어요</p>
              <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/65">
                {dateLong} · {program}
                <br />
                24시간 안에 한국어로 맞춤 일정과 견적을 보내드릴게요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setSubmit('idle');
                }}
                className="mt-6 rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/45 hover:text-white"
              >
                다른 날짜 보기
              </button>
            </div>
          ) : (
            /* 예약 폼 */
            <form onSubmit={onSubmit} className="p-6" noValidate>
              {/* 허니팟 */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* 선택한 날짜 헤더 */}
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5fd6e2]">
                  Reserve
                </p>
                <p className="mt-1.5 font-serif text-2xl leading-tight text-white">{dateLong}</p>
              </div>

              {/* 프로그램 선택(여러 개면 칩, 하나면 표시) */}
              <div className="mt-4">
                <span className={labelCls}>프로그램</span>
                {availPrograms.length > 1 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availPrograms.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProgram(p)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          program === p
                            ? 'border-[#5fd6e2] bg-[#5fd6e2]/15 text-white'
                            : 'border-white/15 text-white/65 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 inline-flex rounded-full border border-[#5fd6e2]/30 bg-[#5fd6e2]/10 px-3 py-1.5 text-sm text-white">
                    {program}
                  </p>
                )}
              </div>

              {/* 인원 */}
              <div className="mt-4">
                <label htmlFor="rp-people" className={labelCls}>
                  인원
                </label>
                <input
                  id="rp-people"
                  name="people"
                  type="number"
                  min={1}
                  defaultValue={2}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              {/* 이름 */}
              <div className="mt-4">
                <label htmlFor="rp-name" className={labelCls}>
                  이름 *
                </label>
                <input id="rp-name" name="name" type="text" required className={`mt-1.5 ${inputCls}`} />
              </div>

              {/* 연락처 */}
              <div className="mt-4">
                <label htmlFor="rp-contact" className={labelCls}>
                  연락처 (이메일·전화·카톡) *
                </label>
                <input
                  id="rp-contact"
                  name="contact"
                  type="text"
                  required
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>

              {/* 메시지 */}
              <div className="mt-4">
                <label htmlFor="rp-message" className={labelCls}>
                  요청사항
                </label>
                <textarea
                  id="rp-message"
                  name="message"
                  rows={3}
                  placeholder="픽업 희망 지역, 다이빙 경험, 궁금한 점 등"
                  className={`mt-1.5 !rounded-card ${inputCls}`}
                />
              </div>

              <button
                type="submit"
                disabled={submit === 'submitting'}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-bold text-[#06202a] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-amber-300 hover:shadow-[0_12px_42px_rgba(246,166,35,0.5)] active:scale-[0.98] disabled:opacity-60"
              >
                {submit === 'submitting' ? '보내는 중…' : '이 날짜로 예약 문의 →'}
              </button>

              {submit === 'error' && (
                <p role="alert" className="mt-3 rounded-button bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
                  전송에 실패했어요. 잠시 후 다시 시도해 주세요.
                </p>
              )}

              <p className="mt-3 text-center text-xs text-white/45">
                예약 전 상담은 무료 · 당일 취소 수수료 없음
              </p>
            </form>
          )}
        </div>

        {/* 날짜 미정 fallback */}
        <p className="mt-3 text-center text-xs text-white/50">
          날짜가 정해지지 않았다면{' '}
          <Link href="/contact" className="text-[#5fd6e2] underline-offset-2 hover:underline">
            일반 문의
          </Link>
          로도 보낼 수 있어요.
        </p>
      </div>
    </div>
  );
}
