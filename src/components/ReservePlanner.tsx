'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import ScheduleCalendar from './ScheduleCalendar';
import ReservationForm from './ReservationForm';
import type { ScheduleItem } from '@/lib/content';

type Status = ScheduleItem['status'];

/**
 * 예약 플래너 — 일정표(좌)와 예약 폼(우)을 하나로 통합.
 * 비어 있는(상품 미등록) 미래 날짜를 클릭하면 우측 패널에 해당 날짜가 고정된 예약 폼이 뜨고,
 * 사용자가 투어를 대분류→중분류로 골라 문의한다. 상품이 박힌 날짜는 정보 표시(클릭 불가).
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
  const [selected, setSelected] = useState<{ key: string; events: ScheduleItem[] } | null>(null);
  const selectedKey = selected?.key ?? null;

  const dateLong = selectedKey
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(new Date(selectedKey))
    : '';

  // 선택한 날짜에 이미 예정된 투어(있으면) → 폼에 컨텍스트로 전달.
  // '예약 가능'은 혼란을 주므로 생략하고, '마감' 같은 제약만 뱃지로 표기.
  const scheduled = selected?.events.map((e) => ({
    program: e.program,
    badge: e.status === 'full' ? statusLabel.full : undefined
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(330px,400px)]">
      {/* 좌: 일정표 (빈 날짜 선택 가능) */}
      <div className="rounded-card border border-white/10 bg-[#06151d]/60 p-5 backdrop-blur-md sm:p-7">
        <ScheduleCalendar
          items={items}
          locale={locale}
          statusLabel={statusLabel}
          emptyLabel={emptyLabel}
          selectable
          selectedKey={selectedKey}
          onSelectDate={(key, events) => setSelected({ key, events })}
        />
      </div>

      {/* 우: 예약 패널 */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-card border border-white/10 bg-gradient-to-b from-[#0e3848]/85 to-[#06151d]/85 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {!selectedKey ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-[#5fd6e2]/30 bg-[#5fd6e2]/10 text-2xl">
                🗓️
              </div>
              <p className="mt-5 font-serif text-xl text-white">날짜를 선택하세요</p>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/60">
                왼쪽 달력에서 <span className="text-[#5fd6e2]">휴무를 제외한 날짜</span>를 누르면
                여기에서 바로 예약을 시작할 수 있어요.
              </p>
            </div>
          ) : (
            <ReservationForm
              key={selectedKey}
              lockedDateKey={selectedKey ?? undefined}
              lockedDateLabel={dateLong}
              scheduled={scheduled}
              onReset={() => setSelected(null)}
            />
          )}
        </div>

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
