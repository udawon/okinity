'use client';

import { useState } from 'react';

/** 안전 체크리스트 — 6개 그룹을 아코디언으로. 펼쳐 읽고 그룹 단위로 '해당 없음' 확인. */
const GROUPS: { title: string; items: string[] }[] = [
  {
    title: '다이빙 후 비행',
    items: [
      '스쿠버다이빙 종료 후 18시간 이내에 비행기 탑승 계획이 없습니다. (스노클링 투어는 해당 없으니 확인만 해주세요.)'
    ]
  },
  {
    title: '귀 · 코 · 부비동',
    items: [
      '현재 귀에 염증이나 통증이 없습니다.',
      '중이염·외이도염 등 귓병, 청력 손실 또는 평형(균형) 장애를 앓았거나 진단받은 적이 없습니다.',
      '귀 또는 부비동(코곁굴) 수술을 받은 적이 없습니다.',
      '현재 감기·코막힘·축농증·기관지염이 없습니다.'
    ]
  },
  {
    title: '호흡기 · 폐',
    items: [
      '순환기 질환, 심한 알레르기 반응(건초열 포함) 또는 폐 질환의 병력이 없습니다.',
      '기흉 또는 호흡기 관련 수술을 받은 적이 없습니다.',
      '천식·폐기종·폐결핵을 앓았거나 진단받은 적이 없습니다.'
    ]
  },
  {
    title: '심혈관 · 혈액 · 대사',
    items: [
      '심장 질환, 심장마비 병력, 심장·혈관 관련 수술을 받은 적이 없습니다.',
      '고혈압·협심증 병력이 없으며, 혈압 조절 약물을 복용한 적이 없습니다.',
      '직계 가족 중 심장마비 또는 뇌졸중 병력이 없습니다.',
      '출혈성 질환 또는 기타 혈액 장애가 없습니다.',
      '당뇨병 또는 당뇨 관련 병력을 앓았거나 진단받은 적이 없습니다.'
    ]
  },
  {
    title: '신경 · 정신 · 약물',
    items: [
      '신체적·정신적 능력 저하 경고가 있는 약물을 복용하고 있지 않습니다.',
      '행동·정신적 장애, 심리 문제 또는 신경계 장애가 없습니다.',
      '발작·일시적 기억상실·실신·경련·간질 병력이 없으며, 이를 예방하기 위한 약물을 복용하고 있지 않습니다.'
    ]
  },
  {
    title: '기타',
    items: [
      '임신 중이 아니며, 임신 가능성도 없습니다.',
      '인공항문(장루) 조성술을 받은 적이 없습니다.',
      '사고·골절·수술 이후 팔 또는 다리에 기능 문제가 발생한 병력이 없습니다.',
      '폐쇄·반폐쇄 공간에 대한 공포 또는 공황발작 병력이 없습니다.'
    ]
  }
];

const TOTAL = GROUPS.length;

export default function MedicalCheckModal({
  onCancel,
  onConfirm,
  submitting
}: {
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  // 한 번에 하나만 열림(다른 영역은 자동으로 닫혀 집중 유도).
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  const toggleOpen = (i: number) => setOpenIndex((cur) => (cur === i ? null : i));

  // '해당 없음' 체크 시: 그룹을 확인 처리하고, 현재 아코디언을 닫은 뒤 다음 미확인 그룹을
  // 자동으로 펼친다(자연스러운 순차 진행). 체크 해제 시에는 전진하지 않고 펼침을 유지(수정 의도).
  const toggleConfirm = (i: number) => {
    const checking = !confirmed.has(i);
    const next = new Set(confirmed);
    checking ? next.add(i) : next.delete(i);
    setConfirmed(next);
    if (!checking) return;
    // i 이후의 미확인 그룹을 우선 탐색, 없으면 처음부터 i 이전까지 탐색. 모두 확인됐으면 닫음(null).
    let target: number | null = null;
    for (let k = i + 1; k < TOTAL; k++) if (!next.has(k)) { target = k; break; }
    if (target === null) for (let k = 0; k < i; k++) if (!next.has(k)) { target = k; break; }
    setOpenIndex(target);
  };

  const allConfirmed = confirmed.size === TOTAL;
  const pct = Math.round((confirmed.size / TOTAL) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center overflow-y-auto bg-black/60 sm:items-center sm:p-4">
      <div className="flex h-dvh w-full max-w-lg flex-col border-white/10 bg-[#06151d] sm:h-auto sm:max-h-[90vh] sm:rounded-card sm:border">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5fd6e2]">
              Safety Check
            </p>
            <h2 className="font-serif text-xl text-white">메디컬 체크</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 본문(스크롤) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-card border border-amber-300/30 bg-amber-400/10 p-4 text-[13px] leading-relaxed text-amber-100/90">
            <p>
              본 메디컬 체크는 고객님의 <strong>안전한 수중 체험</strong>을 위한 필수 확인
              단계입니다. 아래 항목 중 하나라도 해당되시면 안전상 투어 진행이 어려울 수 있습니다.
            </p>
            <p className="mt-2">
              사실과 다르게 작성하여 투어 당일 진행이 불가하거나 사고가 발생한 경우, 그 책임은
              고객님께 있으며 <strong>예약금은 환불되지 않습니다</strong>(OKINITY 귀책 사유 없음).
            </p>
            <p className="mt-2 text-amber-200/80">
              각 영역을 <strong>펼쳐 내용을 확인</strong>한 뒤, 해당사항이 없으면 ‘해당 없음’에
              체크해 주세요.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {GROUPS.map((g, gi) => {
              const open = openIndex === gi;
              const conf = confirmed.has(gi);
              return (
                <div
                  key={gi}
                  className={`overflow-hidden rounded-lg border ${
                    conf ? 'border-[#5fd6e2]/40' : 'border-white/10'
                  }`}
                >
                  {/* 아코디언 헤더 */}
                  <button
                    type="button"
                    onClick={() => toggleOpen(gi)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.05]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                          conf ? 'bg-[#5fd6e2] text-[#06202a]' : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {conf ? '✓' : gi + 1}
                      </span>
                      <span className="text-sm font-semibold text-white">{g.title}</span>
                      <span className="text-[11px] text-white/40">{g.items.length}개</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {conf && (
                        <span className="rounded-full bg-[#5fd6e2]/15 px-2 py-0.5 text-[11px] font-medium text-[#5fd6e2]">
                          확인됨
                        </span>
                      )}
                      <span
                        className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                      >
                        ⌄
                      </span>
                    </span>
                  </button>

                  {/* 아코디언 본문 — 펼쳤을 때만 항목·체크박스 노출(접힌 상태에선 체크 불가) */}
                  {open && (
                    <div className="border-t border-white/10 px-4 py-3">
                      <ul className="space-y-2 text-[13px] leading-relaxed text-white/80">
                        {g.items.map((it, ii) => (
                          <li key={ii} className="flex gap-2">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => toggleConfirm(gi)}
                        aria-pressed={conf}
                        className={`mt-3 flex w-full items-center gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                          conf
                            ? 'border-[#5fd6e2]/50 bg-[#5fd6e2]/10'
                            : 'border-white/15 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[12px] font-bold ${
                            conf ? 'bg-[#5fd6e2] text-[#06202a]' : 'border border-white/30 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="text-sm font-medium text-white">
                          위 항목에 모두 해당사항이 없습니다
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터(고정) */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-white/60">
              확인 <strong className="text-white">{confirmed.size}</strong> / {TOTAL} 영역
            </span>
            {!allConfirmed && <span className="text-amber-300">모든 영역을 펼쳐 확인해 주세요</span>}
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#5fd6e2] transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/20 px-4 py-3 text-sm text-white/70 hover:text-white"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!allConfirmed || submitting}
              className="flex-1 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#06202a] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300 disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? '보내는 중…' : '예약 문의 보내기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
