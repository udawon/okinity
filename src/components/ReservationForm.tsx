'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ACTIVITIES } from './ocean-home-data';
import MedicalCheckModal from './MedicalCheckModal';

const inputCls =
  'w-full rounded-button border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#5fc6ef] focus:outline-none focus:ring-2 focus:ring-[#5fc6ef]/25';
const labelCls = 'block text-xs font-medium uppercase tracking-wider text-white/55';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * 공통 예약 문의 폼 — /reserve의 예약 플래너(ReservePlanner)가 사용.
 * 투어를 대분류(ACTIVITIES.title) → 중분류(tours[].name)로 선택한다.
 * - lockedDateKey 지정: 캘린더에서 고른 날짜 고정(날짜 입력칸 숨김)
 * - 미지정: 날짜 직접 선택(선택 입력) 모드
 */
export default function ReservationForm({
  lockedDateKey,
  lockedDateLabel,
  scheduled,
  timeRestriction,
  initialSlug,
  onReset
}: {
  lockedDateKey?: string;
  lockedDateLabel?: string;
  /** 선택한 날짜에 이미 예정된 투어(정보 표시용). badge는 '마감' 등 제약만 표기('예약 가능'은 생략). */
  scheduled?: { program: string; badge?: string }[];
  /** 운영자 지정 시간대 제한 — 'morning'이면 오전·시간 무관만, 'afternoon'이면 오후·시간 무관만. */
  timeRestriction?: 'morning' | 'afternoon';
  /** 투어 상세에서 넘어온 슬러그 — 대분류·중분류를 사전 선택(없거나 매칭 실패 시 빈 값). */
  initialSlug?: string;
  /** 성공 후 동작(예: 플래너에서 날짜 선택 해제). 없으면 폼 내부에서 새 문의로 초기화. */
  onReset?: () => void;
}) {
  // 슬러그가 속한 대분류를 찾아 초기 선택값으로 사용(매칭 실패 시 빈 폼).
  const presetCat = initialSlug
    ? ACTIVITIES.find((a) => a.tours.some((t) => t.slug === initialSlug))
    : undefined;
  const [catId, setCatId] = useState(presetCat?.id ?? '');
  const [slug, setSlug] = useState(presetCat ? (initialSlug as string) : '');
  const [state, setState] = useState<SubmitState>('idle');
  const [done, setDone] = useState<{ product: string; dateLabel: string } | null>(null);
  const [medOpen, setMedOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const cat = ACTIVITIES.find((a) => a.id === catId);
  // 낚시 외 투어는 메디컬 체크 필수
  const needsMedical = !!cat && cat.id !== 'fishing';
  // 예약이 많은(마감 표기) 투어가 있는 날 → 조율 안내 문구로 전환
  const hasBusy = scheduled?.some((s) => s.badge);

  const todayKey = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(
      t.getDate()
    ).padStart(2, '0')}`;
  })();

  function reset() {
    setState('idle');
    setDone(null);
    setCatId('');
    setSlug('');
  }

  // 제출 버튼 클릭 — 필수값 검증 후, 낚시 외 투어는 메디컬 체크 모달로, 그 외는 바로 전송.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    if (needsMedical) setMedOpen(true);
    else doSubmit(false);
  }

  async function doSubmit(medical: boolean) {
    const form = formRef.current;
    if (!form) return;
    setState('submitting');
    const fd = new FormData(form);
    const tourName = cat?.tours.find((t) => t.slug === slug)?.name ?? '';
    const product = cat ? `${cat.title}${tourName ? ' · ' + tourName : ''}` : '';
    const date = lockedDateKey ?? (String(fd.get('date') || '') || undefined);
    const baseMsg = String(fd.get('message') || '');
    const message = medical
      ? `[메디컬 체크 완료 · 전 항목 확인]${baseMsg ? '\n' + baseMsg : ''}`
      : baseMsg;
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          date,
          time: fd.get('time'),
          people: fd.get('people'),
          name: fd.get('name'),
          contact: fd.get('contact'),
          message,
          company: fd.get('company') // 허니팟
        })
      });
      if (!res.ok) throw new Error('failed');
      setMedOpen(false);
      setDone({ product, dateLabel: lockedDateLabel ?? (date ?? '날짜 미정') });
      setState('success');
    } catch {
      setState('error');
    }
  }

  if (state === 'success' && done) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-[#5fc6ef]/40 bg-[#5fc6ef]/15 text-2xl">
          ✓
        </div>
        <p className="mt-5 font-serif text-xl text-white">문의가 접수되었어요</p>
        <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/65">
          {done.dateLabel}
          {done.product ? ` · ${done.product}` : ''}
          <br />
          24시간 안에 한국어로 맞춤 일정과 견적을 보내드릴게요.
        </p>
        <button
          type="button"
          onClick={() => (onReset ? onReset() : reset())}
          className="mt-6 rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/45 hover:text-white"
        >
          {onReset ? '다른 날짜 보기' : '새 문의 작성'}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-6" noValidate>
      {/* 허니팟 */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {/* 날짜 — 고정(캘린더) 또는 직접 선택 */}
      {lockedDateKey ? (
        <div className="border-b border-white/10 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5fc6ef]">Reserve</p>
          <p className="mt-1.5 font-serif text-2xl leading-tight text-white">{lockedDateLabel}</p>
          {scheduled && scheduled.length > 0 && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                이미 예정된 투어
              </p>
              <ul className="mt-1.5 space-y-1">
                {scheduled.map((s, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm text-white/80">
                    <span>{s.program}</span>
                    {s.badge && (
                      <span className="rounded-full bg-[#f2c879]/15 px-2 py-0.5 text-[11px] font-medium text-[#f2c879]">
                        {s.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-white/45">
                {hasBusy
                  ? '예약이 많은 날이에요. 시간 조율이 필요할 수 있으니 희망 시간대를 남겨주시면 최대한 맞춰드릴게요.'
                  : '다른 시간대·다른 투어도 예약 가능해요. 아래에서 원하는 투어를 선택해 문의해 주세요.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="rf-date" className={labelCls}>
            희망 날짜 (선택)
          </label>
          <input id="rf-date" name="date" type="date" min={todayKey} className={`mt-1.5 ${inputCls}`} />
        </div>
      )}

      {/* 대분류 */}
      <div className="mt-4">
        <label htmlFor="rf-cat" className={labelCls}>
          투어 종류 *
        </label>
        <select
          id="rf-cat"
          required
          value={catId}
          onChange={(e) => {
            setCatId(e.target.value);
            setSlug('');
          }}
          className={`mt-1.5 ${inputCls} [&>option]:text-ink`}
        >
          <option value="" disabled>
            대분류 선택 (스노클링·다이빙·PADI·낚시)
          </option>
          {ACTIVITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* 중분류 */}
      <div className="mt-4">
        <label htmlFor="rf-tour" className={labelCls}>
          세부 프로그램 *
        </label>
        <select
          id="rf-tour"
          required
          value={slug}
          disabled={!cat}
          onChange={(e) => setSlug(e.target.value)}
          className={`mt-1.5 ${inputCls} disabled:opacity-50 [&>option]:text-ink`}
        >
          <option value="" disabled>
            {cat ? '세부 프로그램 선택' : '먼저 투어 종류를 선택하세요'}
          </option>
          {cat?.tours.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* 희망 시간대 — 운영자 지정(오전만/오후만)이 있으면 옵션 제한 */}
      <div className="mt-4">
        <label htmlFor="rf-time" className={labelCls}>
          희망 시간대 (선택)
        </label>
        <select id="rf-time" name="time" defaultValue="" className={`mt-1.5 ${inputCls} [&>option]:text-ink`}>
          <option value="">시간대 선택</option>
          {(timeRestriction === 'afternoon' ? [] : ['오전']).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {(timeRestriction === 'morning' ? [] : ['오후']).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {!timeRestriction && <option value="종일">종일</option>}
          <option value="시간 무관">시간 무관</option>
        </select>
        {timeRestriction && (
          <p className="mt-1 text-[11px] text-[#5fc6ef]">
            이 날짜는 {timeRestriction === 'morning' ? '오전' : '오후'}만 운영합니다.
          </p>
        )}
      </div>

      {/* 인원 */}
      <div className="mt-4">
        <label htmlFor="rf-people" className={labelCls}>
          인원
        </label>
        <input id="rf-people" name="people" type="number" min={1} defaultValue={2} className={`mt-1.5 ${inputCls}`} />
      </div>

      {/* 이름 */}
      <div className="mt-4">
        <label htmlFor="rf-name" className={labelCls}>
          이름 *
        </label>
        <input id="rf-name" name="name" type="text" required className={`mt-1.5 ${inputCls}`} />
      </div>

      {/* 연락처 */}
      <div className="mt-4">
        <label htmlFor="rf-contact" className={labelCls}>
          연락처 (이메일·전화·카톡) *
        </label>
        <input id="rf-contact" name="contact" type="text" required className={`mt-1.5 ${inputCls}`} />
      </div>

      {/* 요청사항 */}
      <div className="mt-4">
        <label htmlFor="rf-message" className={labelCls}>
          요청사항
        </label>
        <textarea
          id="rf-message"
          name="message"
          rows={3}
          placeholder="픽업 희망 지역, 다이빙 경험, 궁금한 점 등"
          className={`mt-1.5 !rounded-card ${inputCls}`}
        />
      </div>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-amber-300 hover:shadow-[0_12px_42px_rgba(246,166,35,0.5)] active:scale-[0.98] disabled:opacity-60"
      >
        {state === 'submitting'
          ? '보내는 중…'
          : needsMedical
            ? '메디컬 체크 & 예약 문의 발송'
            : '예약 문의 보내기 →'}
      </button>

      {needsMedical && (
        <p className="mt-2 text-center text-[11px] text-white/45">
          안전을 위해 다음 단계에서 메디컬 체크 후 발송됩니다. (낚시는 제외)
        </p>
      )}

      {state === 'error' && (
        <p role="alert" className="mt-3 rounded-button bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
          전송에 실패했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-white/45">
        예약 전 상담은 무료 · 예약 당일 취소 수수료 없음
      </p>

      {medOpen && (
        <MedicalCheckModal
          submitting={state === 'submitting'}
          onCancel={() => setMedOpen(false)}
          onConfirm={() => doSubmit(true)}
        />
      )}
    </form>
  );
}
