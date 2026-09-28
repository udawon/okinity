'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ACTIVITIES } from './ocean-home-data';
import { TOUR_NAME_NAV_KEY, FISHING_CLASS_KEYS, type FishingClassKey } from '@/lib/tour';
import { findOption, optionMinPeople, type ReserveOption } from '@/lib/tour-options';
import { buildProduct } from '@/lib/inquiry-product';
import { formatYen } from '@/lib/money';
import { MEDICAL_MARKER } from '@/lib/inquiries/types';
import MedicalCheckModal from './MedicalCheckModal';
import { site } from '@/config/site.config';

// 문의 내역(product)에 실리는 클래스 표기 — 운영자가 읽는 한국어 고정값(표시 라벨만 i18n).
const FISHING_CLASS_PRODUCT: Record<FishingClassKey, string> = {
  middle: '미들 클래스',
  luxury: '럭셔리 클래스'
};

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
  initialSlug,
  initialClass,
  initialPeople,
  initialOption,
  tourTimes,
  tourOptions,
  onReset
}: {
  lockedDateKey?: string;
  lockedDateLabel?: string;
  /** 선택한 날짜에 이미 예정된 일정(정보 표시용 — 입력 원문 그대로). */
  scheduled?: { program: string }[];
  /** 투어 상세에서 넘어온 슬러그 — 대분류·중분류를 사전 선택(없거나 매칭 실패 시 빈 값). */
  initialSlug?: string;
  /** 투어 상세에서 고른 낚시 클래스 — 슬러그가 낚시 투어일 때만 클래스 사전 선택. */
  initialClass?: FishingClassKey;
  /** 투어 상세 예약 카드에서 정한 인원 — 인원 입력칸 기본값(없으면 2명). */
  initialPeople?: number;
  /** 투어 상세에서 고른 옵션 key — 그 투어의 옵션 목록에 있을 때만 사전 선택. */
  initialOption?: string;
  /** 투어별 가능 시간대(어드민 tour_times 설정, slug → 텍스트 배열). 미설정 투어는 '개별 문의' 안내. */
  tourTimes?: Record<string, string[]>;
  /** 투어별 선택 옵션(slug → 목록). 옵션 있는 투어를 고르면 옵션 칸이 필수로 나온다. */
  tourOptions?: Record<string, ReserveOption[]>;
  /** 성공 후 동작(예: 플래너에서 날짜 선택 해제). 없으면 폼 내부에서 새 문의로 초기화. */
  onReset?: () => void;
}) {
  const t = useTranslations('reservation');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  // 슬러그가 속한 대분류를 찾아 초기 선택값으로 사용(매칭 실패 시 빈 폼).
  const presetCat = initialSlug
    ? ACTIVITIES.find((a) => a.tours.some((t) => t.slug === initialSlug))
    : undefined;
  const [catId, setCatId] = useState(presetCat?.id ?? '');
  const [slug, setSlug] = useState(presetCat ? (initialSlug as string) : '');
  const [fishingClass, setFishingClass] = useState<FishingClassKey | ''>(
    presetCat?.id === 'fishing' ? (initialClass ?? '') : ''
  );
  const [optionKey, setOptionKey] = useState(
    presetCat && findOption(tourOptions?.[initialSlug as string] ?? [], initialOption) ? (initialOption as string) : ''
  );
  const [state, setState] = useState<SubmitState>('idle');
  const [done, setDone] = useState<{ product: string; dateLabel: string } | null>(null);
  const [medOpen, setMedOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const cat = ACTIVITIES.find((a) => a.id === catId);
  // 선택한 투어의 시간대 옵션 — '개별 문의'는 항상 마지막에 붙는 고정 옵션과 값이 겹치므로 목록에서 제외.
  const timeOpts = (slug && tourTimes?.[slug]?.filter((tm) => tm !== '개별 문의')) || [];
  const isFishing = cat?.id === 'fishing';
  // 선택 옵션(예: 일반/프라이빗) — 고른 옵션의 최소 인원이 인원 칸의 하한이 된다.
  const options = (slug && tourOptions?.[slug]) || [];
  const option = findOption(options, optionKey);
  const minPeople = optionMinPeople(option);
  // 낚시·요트 크루징은 메디컬 체크 불필요(다이빙·스노클링·PADI만 필수).
  const needsMedical = !!cat && cat.id !== 'fishing' && cat.id !== 'yacht';

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
    setFishingClass('');
    setOptionKey('');
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
    const classLabel = isFishing && fishingClass ? FISHING_CLASS_PRODUCT[fishingClass] : '';
    const product = cat ? buildProduct(cat.title, tourName, classLabel || option?.productLabel) : '';
    const date = lockedDateKey ?? (String(fd.get('date') || '') || undefined);
    const baseMsg = String(fd.get('message') || '');
    const message = medical
      ? `${MEDICAL_MARKER}${baseMsg ? '\n' + baseMsg : ''}`
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
          email: fd.get('email'),
          contact: fd.get('contact'),
          message,
          company: fd.get('company') // 허니팟
        })
      });
      if (!res.ok) throw new Error('failed');
      setMedOpen(false);
      setDone({ product, dateLabel: lockedDateLabel ?? (date ?? t('dateTbd')) });
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
        <p className="mt-5 font-serif text-xl text-white">{t('successTitle')}</p>
        <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/65">
          {done.dateLabel}
          {done.product ? ` · ${done.product}` : ''}
          <br />
          {t('successBody')}
        </p>
        {site.contact.kakaoChannel && (
          <a
            href={site.contact.kakaoChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FEE500] px-5 py-2.5 text-sm font-semibold text-[#3C1E1E] transition-opacity hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" fill="#3C1E1E" className="h-4 w-4" aria-hidden="true">
              <path d="M12 4.3C6.9 4.3 2.75 7.5 2.75 11.46c0 2.54 1.7 4.77 4.27 6.03-.19.64-.67 2.3-.77 2.66-.12.45.17.44.35.32.14-.09 2.23-1.5 3.13-2.11.74.11 1.5.16 2.27.16 5.1 0 9.25-3.2 9.25-7.16S17.1 4.3 12 4.3z" />
            </svg>
            {t('successKakao')}
          </a>
        )}
        <button
          type="button"
          onClick={() => (onReset ? onReset() : reset())}
          className="mt-3 rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/45 hover:text-white"
        >
          {onReset ? t('successAnotherDate') : t('successNew')}
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
                {t('scheduledTitle')}
              </p>
              <ul className="mt-1.5 space-y-1">
                {scheduled.map((s, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm text-white/80">
                    <span>{s.program}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-white/45">{t('freeNote')}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="rf-date" className={labelCls}>
            {t('dateOptional')}
          </label>
          <input id="rf-date" name="date" type="date" min={todayKey} className={`mt-1.5 ${inputCls}`} />
        </div>
      )}

      {/* 대분류 */}
      <div className="mt-4">
        <label htmlFor="rf-cat" className={labelCls}>
          {t('category')} *
        </label>
        <select
          id="rf-cat"
          required
          value={catId}
          onChange={(e) => {
            setCatId(e.target.value);
            setSlug('');
            setFishingClass('');
            setOptionKey('');
          }}
          className={`mt-1.5 ${inputCls} app-select app-select-dark [&>option]:text-ink`}
        >
          <option value="" disabled>
            {t('categoryPlaceholder')}
          </option>
          {ACTIVITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {tNav(a.id)}
            </option>
          ))}
        </select>
      </div>

      {/* 중분류 */}
      <div className="mt-4">
        <label htmlFor="rf-tour" className={labelCls}>
          {t('program')} *
        </label>
        <select
          id="rf-tour"
          required
          value={slug}
          disabled={!cat}
          onChange={(e) => {
            setSlug(e.target.value);
            setOptionKey('');
          }}
          className={`mt-1.5 ${inputCls} disabled:opacity-50 app-select app-select-dark [&>option]:text-ink`}
        >
          <option value="" disabled>
            {cat ? t('programPlaceholder') : t('programPlaceholderEmpty')}
          </option>
          {cat?.tours.map((tr) => (
            <option key={tr.slug} value={tr.slug}>
              {TOUR_NAME_NAV_KEY[tr.slug] ? tNav(TOUR_NAME_NAV_KEY[tr.slug]) : tr.name}
            </option>
          ))}
        </select>
      </div>

      {/* 소분류(클래스) — 낚시 선택 시에만 노출(미들/럭셔리). 문의 내역에 함께 기록. */}
      {isFishing && (
        <div className="mt-4">
          <label htmlFor="rf-class" className={labelCls}>
            {t('classLabel')} *
          </label>
          <select
            id="rf-class"
            required
            value={fishingClass}
            onChange={(e) => setFishingClass(e.target.value as FishingClassKey)}
            className={`mt-1.5 ${inputCls} app-select app-select-dark [&>option]:text-ink`}
          >
            <option value="" disabled>
              {t('classPlaceholder')}
            </option>
            {FISHING_CLASS_KEYS.map((key) => (
              <option key={key} value={key}>
                {key === 'middle' ? t('classMiddle') : t('classLuxury')}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 선택 옵션 — 옵션을 등록한 투어(예: 스노클링 일반/프라이빗)만. 문의 내역에 한국어 이름으로 기록. */}
      {options.length > 0 && (
        <div className="mt-4">
          <label htmlFor="rf-option" className={labelCls}>
            {t('optionLabel')} *
          </label>
          <select
            id="rf-option"
            required
            value={optionKey}
            onChange={(e) => {
              setOptionKey(e.target.value);
              // 투어 상세 예약 카드와 같게 — 최소 인원보다 적으면 최소 인원으로 올린다.
              const min = optionMinPeople(findOption(options, e.target.value));
              const input = formRef.current?.elements.namedItem('people');
              if (input instanceof HTMLInputElement && Number(input.value) < min) input.value = String(min);
            }}
            className={`mt-1.5 ${inputCls} app-select app-select-dark [&>option]:text-ink`}
          >
            <option value="" disabled>
              {t('optionPlaceholder')}
            </option>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {[
                  o.label,
                  o.pricePerPerson != null && t('optionPerPerson', { price: formatYen(o.pricePerPerson, locale) }),
                  optionMinPeople(o) > 1 && t('optionFrom', { n: optionMinPeople(o) })
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 희망 시간대 — 세부 프로그램 선택 후에만 노출. 어드민 설정(tour_times) 시간대가 선택지가 된다 */}
      {slug && (
        <div className="mt-4">
          {timeOpts.length > 0 ? (
            <>
              <label htmlFor="rf-time" className={labelCls}>
                {t('time')}
              </label>
              {/* option value는 입력 원문/한국어 고정(운영자가 읽는 값), '개별 문의' 라벨만 번역.
                  key={slug}로 투어 변경 시 이전 선택이 남지 않게 리셋 */}
              <select
                key={slug}
                id="rf-time"
                name="time"
                defaultValue=""
                className={`mt-1.5 ${inputCls} app-select app-select-dark [&>option]:text-ink`}
              >
                <option value="">{t('timePlaceholder')}</option>
                {timeOpts.map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
                <option value="개별 문의">{t('timeAsk')}</option>
              </select>
            </>
          ) : (
            <>
              {/* 시간대 미설정 투어 — 개별 안내 문구 + 고정값 전송 */}
              <span className={labelCls}>{t('time')}</span>
              <p className="mt-1.5 rounded-button border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/70">
                {t('timeIndividual')}
              </p>
              <input type="hidden" name="time" value="개별 문의" />
            </>
          )}
        </div>
      )}

      {/* 인원 */}
      <div className="mt-4">
        <label htmlFor="rf-people" className={labelCls}>
          {t('people')}
        </label>
        <input
          id="rf-people"
          name="people"
          type="number"
          min={minPeople}
          max={50}
          defaultValue={Math.max(initialPeople ?? 2, minPeople)}
          aria-describedby={option && minPeople > 1 ? 'rf-people-hint' : undefined}
          className={`mt-1.5 ${inputCls}`}
        />
        {option && minPeople > 1 && (
          <p id="rf-people-hint" className="mt-1.5 text-xs text-white/60">
            {t('optionMinHint', { name: option.label, n: minPeople })}
          </p>
        )}
      </div>

      {/* 이름 */}
      <div className="mt-4">
        <label htmlFor="rf-name" className={labelCls}>
          {t('name')} *
        </label>
        <input id="rf-name" name="name" type="text" required className={`mt-1.5 ${inputCls}`} />
      </div>

      {/* 이메일 — 확정/변경/취소 안내 수신용(필수) */}
      <div className="mt-4">
        <label htmlFor="rf-email" className={labelCls}>
          {t('email')} *
        </label>
        <input
          id="rf-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          className={`mt-1.5 ${inputCls}`}
        />
      </div>

      {/* 연락처(전화/카카오톡/라인) */}
      <div className="mt-4">
        <label htmlFor="rf-contact" className={labelCls}>
          {t('contact')} *
        </label>
        <input
          id="rf-contact"
          name="contact"
          type="text"
          required
          placeholder={t('contactPlaceholder')}
          className={`mt-1.5 ${inputCls}`}
        />
      </div>

      {/* 요청사항 */}
      <div className="mt-4">
        <label htmlFor="rf-message" className={labelCls}>
          {t('message')}
        </label>
        <textarea
          id="rf-message"
          name="message"
          rows={3}
          placeholder={t('messagePlaceholder')}
          className={`mt-1.5 !rounded-card ${inputCls}`}
        />
      </div>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-amber-300 hover:shadow-[0_12px_42px_rgba(246,166,35,0.5)] active:scale-[0.98] disabled:opacity-60"
      >
        {state === 'submitting'
          ? t('submitting')
          : needsMedical
            ? t('submitMedical')
            : t('submit')}
      </button>

      {needsMedical && (
        <p className="mt-2 text-center text-[11px] text-white/45">
          {t('medicalNote')}
        </p>
      )}

      {state === 'error' && (
        <p role="alert" className="mt-3 rounded-button bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
          {t('errorMsg')}
        </p>
      )}

      <p className="mt-3 text-center text-xs text-white/45">{t('freeConsult')}</p>

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
