'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveInquirySettlement } from '@/app/admin/actions';
import StatusControl from './StatusControl';
import MemoCell from './MemoCell';
import EditInquiryButton from './EditInquiryButton';
import DeleteInquiryButton from './DeleteInquiryButton';
import { splitMedical, type Inquiry, type InquiryStatus } from '@/lib/inquiries/types';
import type { InquirySettlement } from '@/lib/inquiry-settlement';

const STATUS_LABEL: Record<InquiryStatus, string> = {
  tentative: '가예약',
  confirmed: '확정',
  done: '완료',
  canceled: '취소'
};
const STATUS_CLS: Record<InquiryStatus, string> = {
  tentative: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  done: 'bg-emerald-100 text-emerald-700',
  canceled: 'bg-gray-100 text-gray-500 line-through'
};

const numCls =
  'w-24 rounded-button border border-line bg-bg px-2.5 py-1.5 text-right text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-50';

/** 희망일/접수 표시용: YYYY-MM-DD → M/D. */
function shortDate(d?: string): string {
  const m = (d ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[2])}/${Number(m[3])}` : (d ?? '');
}

/** 접수 시각(오키나와 JST) → YYYY.MM.DD HH:MM. */
function fmtReceived(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
    .format(d)
    .replace(/-/g, '.');
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
  return `${date} ${time}`;
}

/** 연락처가 전화면 tel:, 이메일이면 mailto: 로 연결. */
function ContactLink({ contact }: { contact: string }) {
  if (contact.includes('@')) {
    return (
      <a href={`mailto:${contact}`} className="text-sky-600 hover:underline">
        {contact}
      </a>
    );
  }
  const digits = contact.replace(/[^0-9+]/g, '');
  if (digits.replace(/\D/g, '').length >= 8) {
    return (
      <a href={`tel:${digits}`} className="text-sky-600 hover:underline">
        {contact}
      </a>
    );
  }
  return <span className="text-ink">{contact}</span>;
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

/**
 * 예약 1건 행(월별 보기) — 요약(확정일·고객·정산금액) + '상세' 펼침.
 * 상세에는 전체 목록과 동일한 정보·관리(접수·이메일·연락처·시간대·메시지·메모·상태변경·수정/삭제)를 모두 노출한다.
 * 정산금액은 한쪽(¥/₩)을 입력하면 환율로 다른 쪽이 자동 계산된다.
 */
export default function SettlementRow({
  inquiry,
  settlement,
  rate
}: {
  inquiry: Inquiry;
  settlement: InquirySettlement;
  rate: number;
}) {
  const router = useRouter();
  const baseDate = settlement.confirmedDate ?? '';
  const baseJpy = settlement.amountJPY != null ? String(settlement.amountJPY) : '';
  const baseKrw = settlement.amountKRW != null ? String(settlement.amountKRW) : '';

  const [open, setOpen] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState(baseDate);
  const [jpy, setJpy] = useState(baseJpy);
  const [krw, setKrw] = useState(baseKrw);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 메디컬 체크 완료 표식을 요청사항(메시지)과 분리.
  const { medicalChecked, request } = splitMedical(inquiry.message);

  const dirty = confirmedDate !== baseDate || jpy !== baseJpy || krw !== baseKrw;

  function onJpy(v: string) {
    setJpy(v);
    setSaved(false);
    const n = Number(v);
    if (!v.trim()) setKrw('');
    else if (Number.isFinite(n) && rate > 0) setKrw(String(Math.round(n * rate)));
  }
  function onKrw(v: string) {
    setKrw(v);
    setSaved(false);
    const n = Number(v);
    if (!v.trim()) setJpy('');
    else if (Number.isFinite(n) && rate > 0) setJpy(String(Math.round(n / rate)));
  }

  async function save() {
    setSaving(true);
    const jn = Number(jpy);
    const kn = Number(krw);
    try {
      await saveInquirySettlement(inquiry.id, {
        confirmedDate: confirmedDate.trim(),
        amountJPY: jpy.trim() && Number.isFinite(jn) && jn >= 0 ? Math.round(jn) : undefined,
        amountKRW: krw.trim() && Number.isFinite(kn) && kn >= 0 ? Math.round(kn) : undefined
      });
      setSaved(true);
      router.refresh();
    } catch {
      /* dirty 유지 — 재시도 */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b border-line last:border-0">
      {/* 요약 행 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 hover:bg-bg/40">
        {/* 확정일 */}
        <div className="flex flex-col">
          <input
            type="date"
            aria-label="확정일"
            value={confirmedDate.slice(0, 10)}
            onChange={(e) => {
              setConfirmedDate(e.target.value);
              setSaved(false);
            }}
            className="rounded-button border border-line bg-bg px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
          />
          <span className="mt-0.5 pl-0.5 text-[11px] text-muted">
            희망일 {inquiry.date ? shortDate(inquiry.date) : '미입력'}
          </span>
        </div>

        {/* 고객 · 상품 */}
        <div className="min-w-[10rem] flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{inquiry.name}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[inquiry.status]}`}>
              {STATUS_LABEL[inquiry.status]}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted">
            {inquiry.product ?? '상품 미정'}
            {inquiry.people ? ` · ${inquiry.people}명` : ''}
            {inquiry.time ? ` · ${inquiry.time}` : ''}
          </div>
        </div>

        {/* 정산금액 ¥ / ₩ */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">¥</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={jpy}
            onChange={(e) => onJpy(e.target.value)}
            placeholder="0"
            className={numCls}
          />
          <span className="text-muted">≈</span>
          <span className="text-sm text-muted">₩</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={krw}
            onChange={(e) => onKrw(e.target.value)}
            placeholder="0"
            className={numCls}
          />
        </div>

        {/* 저장 + 상세 — 동일 크기(통일감). 금액 칸과 간격을 두기 위해 좌측 마진. */}
        <div className="ml-2 flex items-center gap-2 sm:ml-5">
          {dirty ? (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-button bg-brand px-2.5 py-1.5 text-xs font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? '저장 중' : '저장'}
            </button>
          ) : (
            // 변경 없을 땐 같은 크기의 자리(투명/저장됨)로 레이아웃 흔들림 방지
            <span
              aria-hidden={!saved}
              className={`rounded-button px-2.5 py-1.5 text-xs font-semibold ${
                saved ? 'text-emerald-600' : 'text-transparent'
              }`}
            >
              {saved ? '저장됨' : '저장'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-button border border-line px-2.5 py-1.5 text-xs text-muted hover:border-brand hover:text-ink"
          >
            상세 {open ? '▴' : '▾'}
          </button>
        </div>
      </div>

      {/* 상세 (펼침) — 전체 목록과 동일한 정보·관리 */}
      {open && (
        <div className="border-t border-line/60 bg-bg/30 px-4 py-4">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="접수(JST)">{fmtReceived(inquiry.createdAt)}</DetailField>
            <DetailField label="이메일">
              {inquiry.email ? (
                <a href={`mailto:${inquiry.email}`} className="text-sky-600 hover:underline">
                  {inquiry.email}
                </a>
              ) : (
                <span className="text-muted">-</span>
              )}
            </DetailField>
            <DetailField label="연락처">
              <ContactLink contact={inquiry.contact} />
            </DetailField>
            <DetailField label="희망 시간대">{inquiry.time || <span className="text-muted">-</span>}</DetailField>
            <DetailField label="인원">{inquiry.people ? `${inquiry.people}명` : <span className="text-muted">-</span>}</DetailField>
            <DetailField label="메디컬 체크">
              {medicalChecked ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  완료 · 전 항목 확인
                </span>
              ) : (
                <span className="text-muted">해당 없음</span>
              )}
            </DetailField>
          </dl>

          {/* 요청사항 — 메디컬 표식을 제외한 고객 메시지만 */}
          <div className="mt-4">
            <dt className="text-[11px] uppercase tracking-wider text-muted">요청사항</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-card border border-line bg-surface px-3 py-2 text-sm text-ink">
              {request ? request : <span className="text-muted">-</span>}
            </dd>
          </div>

          {/* 메모 + 상태/관리 */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">메모(운영자)</dt>
              <dd className="mt-1">
                <MemoCell id={inquiry.id} note={inquiry.note} />
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted">상태</span>
              <StatusControl id={inquiry.id} status={inquiry.status} />
              <EditInquiryButton inquiry={inquiry} />
              <DeleteInquiryButton id={inquiry.id} name={inquiry.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
