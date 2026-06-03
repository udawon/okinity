'use client';

import { useMemo, useState } from 'react';
import StatusControl from './StatusControl';
import DeleteInquiryButton from './DeleteInquiryButton';
import EditInquiryButton from './EditInquiryButton';
import MemoCell from './MemoCell';
import type { Inquiry, InquiryStatus } from '@/lib/inquiries/types';

/** 접수 시각(오키나와 JST) → 날짜 YYYY.MM.DD + 시간 HH:MM(24h) 두 줄. */
function fmtReceived(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
    .format(d)
    .replace(/-/g, '.'); // YYYY.MM.DD
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d); // HH:MM (24h)
  return { date, time };
}

const FILTERS: { key: 'all' | InquiryStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'tentative', label: '가예약' },
  { key: 'confirmed', label: '확정' },
  { key: 'done', label: '완료' },
  { key: 'canceled', label: '취소' }
];

/** 연락처가 전화면 tel:, 이메일이면 mailto: 로 바로 연결. */
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
  return <span>{contact}</span>;
}

export default function InquiryTable({ inquiries }: { inquiries: Inquiry[] }) {
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inquiries.length };
    for (const i of inquiries) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [inquiries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (filter !== 'all' && i.status !== filter) return false;
      if (!needle) return true;
      return [i.name, i.contact, i.product, i.message].some((v) =>
        v?.toLowerCase().includes(needle)
      );
    });
  }, [inquiries, filter, query]);

  return (
    <div>
      {/* 필터 칩 + 검색 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n = counts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand bg-brand text-white'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                {f.label} {n > 0 && <span className={active ? 'opacity-80' : ''}>({n})</span>}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·연락처·상품·메시지 검색"
          className="ml-auto w-full max-w-xs rounded-button border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-muted">
          {query || filter !== 'all' ? '조건에 맞는 문의가 없습니다.' : '아직 접수된 문의가 없습니다.'}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">접수(JST)</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">희망일</th>
                <th className="px-4 py-3 text-center font-medium">시간대</th>
                <th className="px-4 py-3 text-center font-medium">인원</th>
                <th className="px-4 py-3 font-medium">메시지</th>
                <th className="px-4 py-3 font-medium">메모</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-line align-top transition-colors last:border-0 hover:bg-bg/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    <div className="text-ink">{fmtReceived(q.createdAt).date}</div>
                    <div className="text-xs">{fmtReceived(q.createdAt).time}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{q.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">
                    <ContactLink contact={q.contact} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">{q.product ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">{q.date ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-ink">{q.time ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-ink">
                    {q.people ?? '-'}
                  </td>
                  <td className="min-w-[14rem] max-w-md whitespace-normal px-4 py-3 text-muted">
                    {q.message ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <MemoCell id={q.id} note={q.note} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusControl id={q.id} status={q.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <EditInquiryButton inquiry={q} />
                      <DeleteInquiryButton id={q.id} name={q.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
