'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cdnMedia } from '@/lib/media';
import { formatKrw, formatYen } from '@/lib/money';
import {
  FISHING_CLASS_KEYS,
  approxKrw,
  estimateTotal,
  maxPeopleOf,
  startingPrice,
  type FishingClassKey,
  type TourClasses,
  type TourPricing
} from '@/lib/tour';
import {
  clampPeople,
  findOption,
  optionPeopleRange,
  optionPeopleRule,
  pricingWithOption,
  type TourOption
} from '@/lib/tour-options';
import Icon from './icons';

/**
 * 투어 상세의 예약 영역 — 클래스(낚시)·옵션·인원 선택을 본문 카드·예약 카드·모바일 하단 바가 공유한다.
 * 날짜는 여기서 고르지 않는다(예약 달력 /reserve 의 역할). 선택값은 ?tour=&class=&option=&people= 로 넘긴다.
 */

type BookingState = {
  cls: FishingClassKey;
  setCls: (c: FishingClassKey) => void;
  /** 고른 옵션(옵션이 없는 투어면 undefined). */
  option: TourOption | undefined;
  /** 옵션을 바꾸면 인원이 그 옵션의 최소 인원보다 적지 않게 올린다. */
  selectOption: (key: string) => void;
  people: number;
  setPeople: (n: number) => void;
};

const BookingContext = createContext<BookingState | null>(null);

export function TourBookingProvider({ options = [], children }: { options?: TourOption[]; children: ReactNode }) {
  const [cls, setCls] = useState<FishingClassKey>('middle');
  const [optionKey, setOptionKey] = useState(options[0]?.key ?? '');
  // 처음 인원 = 2명(첫 옵션의 최소~최대 안으로. 예: 1인 단독 옵션이 맨 위면 1명)
  const [people, setPeople] = useState(() => {
    const r = optionPeopleRange(options[0]);
    return clampPeople(2, r.min, r.max);
  });
  const value = useMemo(() => {
    const option = findOption(options, optionKey);
    const selectOption = (key: string) => {
      const next = findOption(options, key);
      if (!next) return;
      setOptionKey(key);
      const r = optionPeopleRange(next);
      setPeople((p) => clampPeople(p, r.min, r.max));
    };
    return { cls, setCls, option, selectOption, people, setPeople };
  }, [cls, optionKey, options, people]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

function useBooking(): BookingState {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('TourBookingProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}

/** 예약 카드·하단 바가 공통으로 받는 요금 정보(서버에서 계산해 직렬화 가능한 값만). */
export type BookingInfo = {
  slug: string;
  pricing: TourPricing;
  /** 가격 안내 글(요금 방식이 text 이거나 숫자가 없을 때 표시). */
  priceText: string;
  /** 낚시 클래스별 가격 글(비었으면 null). */
  classPrices: Record<FishingClassKey, string> | null;
  hasClasses: boolean;
  /** 선택 옵션(손님 언어 이름, 2개 이상일 때만 — 없으면 빈 배열). */
  options: TourOption[];
  /** 투어 시간대(어드민 '투어 시간대'). */
  times: string[];
  /** 자유 출발형 등 출발 안내 글. */
  startNote: string;
  /** 1엔 = N원(한국어 페이지에서만 전달, 그 외 null). */
  rate: number | null;
  kakaoUrl: string;
};

/** 선택 상태에 따른 요금 표시 계산 — 카드와 하단 바가 같은 결과를 쓴다. */
function usePriceView(info: BookingInfo) {
  const t = useTranslations('tourDetail');
  const locale = useLocale();
  const { cls, option, people } = useBooking();
  const clsKey = info.hasClasses ? cls : '';
  const clsLabel = cls === 'middle' ? t('classMiddle') : t('classLuxury');
  // 옵션에 1인 요금이 있으면 그 요금 × 인원(투어 요금 방식 대신)
  const pricing = pricingWithOption(info.pricing, option);
  const optionPriced = option?.pricePerPerson != null;
  // 옵션 인원 범위(최대 인원이 없으면 제한 없음)
  const { min } = optionPeopleRange(option);
  const optionMax = option?.maxPeople != null ? optionPeopleRange(option).max : null;

  const from = startingPrice(pricing, clsKey);
  const total = estimateTotal(pricing, people, clsKey);
  const max = maxPeopleOf(pricing, clsKey);
  const calculable = from != null;

  let label = t('bookLabelPrice');
  let main = info.priceText;
  if (pricing.priceMode === 'inquiry') {
    main = t('bookInquiry');
  } else if (pricing.priceMode === 'perPerson' && from != null) {
    label = optionPriced ? t('bookLabelOption', { option: option!.name }) : t('bookLabelPerPerson');
    main = formatYen(from, locale);
  } else if (pricing.priceMode === 'boat' && from != null) {
    label = info.hasClasses ? t('bookLabelBoatClass', { cls: clsLabel }) : t('bookLabelBoat');
    main = t('bookFrom', { price: formatYen(from, locale) });
  } else if (info.classPrices && info.classPrices[cls]) {
    label = t('bookLabelClass', { cls: clsLabel });
    main = info.classPrices[cls];
  }

  const krw = (yen: number) => (info.rate ? formatKrw(approxKrw(yen, info.rate)) : null);
  return { label, main, from, total, max, min, optionMax, calculable, krw, locale, clsLabel, pricing };
}

function reserveHref(
  info: BookingInfo,
  sel: { cls: FishingClassKey; option: TourOption | undefined; people: number },
  calculable: boolean
) {
  const q = new URLSearchParams({ tour: info.slug });
  if (info.hasClasses) q.set('class', sel.cls);
  if (sel.option) q.set('option', sel.option.key);
  if (calculable) q.set('people', String(sel.people));
  return `/reserve?${q.toString()}`;
}

/** 오른쪽(모바일은 본문 끝) 예약 카드. */
export function BookingCard({ info }: { info: BookingInfo }) {
  const t = useTranslations('tourDetail');
  const { cls, setCls, option, selectOption, people, setPeople } = useBooking();
  const v = usePriceView(info);
  // 구간 요금은 최대 인원 +1 까지 올려 '초과 시 문의' 안내를 보여주고, 제한이 없으면 20명까지.
  // 인원 상한 — 옵션 최대 인원이 있으면 그 이상 못 고름. 배 요금 구간은 초과 안내를 위해 +1까지.
  const cap = v.optionMax ?? (v.max != null ? v.max + 1 : 20);
  const over = v.calculable && v.total == null && v.max != null && people > v.max;
  const longMain = v.main.length > 14;

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e3858]/90 to-[#061522]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="text-[13px] text-white/60">{v.label}</div>
      <div className={`mt-1 font-bold leading-snug text-white ${longMain ? 'text-lg' : 'text-[30px] tracking-tight'}`}>
        {v.main || t('bookInquiry')}
      </div>
      {v.from != null && v.krw(v.from) && (
        <div className="mt-1 text-xs text-white/60">
          {t('krwApprox', { krw: v.krw(v.from)!, rate: info.rate!.toFixed(2) })}
        </div>
      )}
      {v.pricing.priceMode === 'perPerson' && v.pricing.priceSolo != null && (
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm text-white/75">
          <span>{t('bookSolo')}</span>
          <strong className="text-white">{formatYen(v.pricing.priceSolo, v.locale)}</strong>
        </div>
      )}

      {info.options.length > 0 && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-[13px] font-bold text-white/80">{t('optionTitle')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {info.options.map((o) => (
              <button
                key={o.key}
                type="button"
                aria-pressed={option?.key === o.key}
                onClick={() => selectOption(o.key)}
                className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-bold leading-tight transition-colors ${
                  option?.key === o.key ? 'border-[#5fc6ef] bg-[#5fc6ef] text-[#06202f]' : 'border-white/15 text-white hover:border-white/40'
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {info.hasClasses && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-[13px] font-bold text-white/80">{t('classTitle')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {FISHING_CLASS_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={cls === k}
                onClick={() => setCls(k)}
                className={`h-11 rounded-xl border text-sm font-bold transition-colors ${
                  cls === k ? 'border-[#5fc6ef] bg-[#5fc6ef] text-[#06202f]' : 'border-white/15 text-white hover:border-white/40'
                }`}
              >
                {k === 'middle' ? t('classMiddle') : t('classLuxury')}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-5">
        <div className="mb-2 text-[13px] font-bold text-white/80">{t('bookTimes')}</div>
        {info.times.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {info.times.map((time) => (
              <span key={time} className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white">
                {time}
              </span>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 px-3.5 py-3 text-sm leading-relaxed text-white/70">
            {info.startNote || t('bookTimesAsk')}
          </p>
        )}
      </div>

      {v.calculable && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[13px] font-bold text-white/80">{t('bookPeople')}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPeople(Math.max(v.min, people - 1))}
                disabled={people <= v.min}
                aria-label={t('peopleDec')}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-lg text-white transition-colors hover:border-white/50 disabled:opacity-30"
              >
                −
              </button>
              <output aria-live="polite" className="min-w-[3ch] text-center text-lg font-bold text-white">
                {t('peopleCount', { n: people })}
              </output>
              <button
                type="button"
                onClick={() => setPeople(Math.min(cap, people + 1))}
                disabled={people >= cap}
                aria-label={t('peopleInc')}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-lg text-white transition-colors hover:border-white/50 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
          {option && <OptionPeopleNote option={option} />}
          <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-white/75">
              {t('bookTotal')}
              {v.total != null && v.krw(v.total) && (
                <span className="block text-xs text-white/55">{t('krwTotal', { krw: v.krw(v.total)! })}</span>
              )}
            </span>
            {over ? (
              <span className="max-w-[60%] text-right text-sm text-amber-200">{t('bookOverMax', { max: v.max! })}</span>
            ) : (
              <strong className="text-2xl text-white">{v.total != null ? formatYen(v.total, v.locale) : '—'}</strong>
            )}
          </div>
        </>
      )}

      <Link
        href={reserveHref(info, { cls, option, people }, v.calculable)}
        className="mt-6 flex h-14 items-center justify-center gap-2 rounded-full bg-amber-400 text-base font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300"
      >
        {t('bookCta')}
        <Icon name="arrow" className="h-5 w-5" strokeWidth={2.2} />
      </Link>
      {info.kakaoUrl && (
        <a
          href={info.kakaoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-bold text-white transition-colors hover:border-white/50"
        >
          <Icon name="chat" className="h-4 w-4 fill-[#fee500] text-[#fee500]" />
          {t('bookKakao')}
        </a>
      )}
      <p className="mt-4 text-xs leading-relaxed text-white/55">{t('bookNote')}</p>
    </div>
  );
}

/** 모바일 하단 고정 바 — 요금 요약 + 예약 버튼. 본문을 가리지 않도록 페이지가 하단 여백을 둔다. */
export function MobileBookBar({ info }: { info: BookingInfo }) {
  const t = useTranslations('tourDetail');
  const { cls, option, people } = useBooking();
  const v = usePriceView(info);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-white/10 bg-[#061522]/95 px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-white/60">{v.label}</div>
        <div className="truncate text-lg font-bold text-white">{v.main || t('bookInquiry')}</div>
      </div>
      <Link
        href={reserveHref(info, { cls, option, people }, v.calculable)}
        className="flex h-12 shrink-0 items-center rounded-full bg-amber-400 px-5 text-[15px] font-bold text-[#06202f]"
      >
        {t('mobileCta')}
      </Link>
    </div>
  );
}

/** 낚시 클래스 카드 — 배 사진·가격·설명. 선택은 예약 카드와 공유. */
export function TourClassCards({
  classes,
  classPrices
}: {
  classes: TourClasses;
  classPrices: Record<FishingClassKey, string> | null;
}) {
  const t = useTranslations('tourDetail');
  const { cls, setCls } = useBooking();
  return (
    <div role="radiogroup" aria-label={t('classTitle')} className="mt-5 grid gap-4 sm:grid-cols-2">
      {FISHING_CLASS_KEYS.map((k) => {
        const c = classes[k];
        const selected = cls === k;
        const lines = c.description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setCls(k)}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-[#061522]/60 text-left backdrop-blur-md transition-colors ${
              selected ? 'border-amber-400 ring-1 ring-amber-400' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <span
              aria-hidden
              className={`absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full border-2 ${
                selected ? 'border-amber-400 bg-amber-400 text-[#06202f]' : 'border-white/60 bg-[#061522]/70 text-transparent'
              }`}
            >
              <Icon name="check" className="h-4 w-4" strokeWidth={3} />
            </span>
            {c.image?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cdnMedia(c.image)} alt="" loading="lazy" className="h-44 w-full object-cover" />
            ) : (
              <span className="h-2" />
            )}
            <span className="flex flex-1 flex-col gap-2.5 p-5">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-bold text-white">{k === 'middle' ? t('classMiddle') : t('classLuxury')}</span>
                {classPrices?.[k] && <span className="text-right text-[15px] font-bold text-amber-300">{classPrices[k]}</span>}
              </span>
              {lines.length > 0 ? (
                <ul className="space-y-1 text-sm leading-relaxed text-white/75">
                  {lines.map((l, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-white/50" />
                      {l}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-white/60">{t('classPreparing')}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 선택 옵션 카드(예: 일반 / 프라이빗) — 1인 요금·최소 인원·설명. 선택은 예약 카드와 공유. */
export function TourOptionCards({ options }: { options: TourOption[] }) {
  const t = useTranslations('tourDetail');
  const locale = useLocale();
  const { option, selectOption } = useBooking();
  return (
    <div role="radiogroup" aria-label={t('optionTitle')} className="mt-5 grid gap-4 sm:grid-cols-2">
      {options.map((o) => {
        const selected = option?.key === o.key;
        const lines = o.description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => selectOption(o.key)}
            className={`relative flex flex-col gap-3 rounded-2xl border bg-[#061522]/60 p-5 pr-14 text-left backdrop-blur-md transition-colors ${
              selected ? 'border-amber-400 ring-1 ring-amber-400' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <span
              aria-hidden
              className={`absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full border-2 ${
                selected ? 'border-amber-400 bg-amber-400 text-[#06202f]' : 'border-white/60 bg-[#061522]/70 text-transparent'
              }`}
            >
              <Icon name="check" className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="text-lg font-bold text-white">{o.name}</span>
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {o.pricePerPerson != null && (
                <span className="text-[15px] font-bold text-amber-300">
                  {t('optionPerPerson', { price: formatYen(o.pricePerPerson, locale) })}
                </span>
              )}
              <span className="text-sm text-white/70">{peopleRuleLabel(t, o)}</span>
            </span>
            {lines.length > 0 && (
              <ul className="space-y-1 text-sm leading-relaxed text-white/75">
                {lines.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-white/50" />
                    {l}
                  </li>
                ))}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}

type TourDetailT = ReturnType<typeof useTranslations<'tourDetail'>>;

/** 옵션 카드의 인원 규칙 — "N명부터" / "N~M명" / "N명만". */
function peopleRuleLabel(t: TourDetailT, o: TourOption): string {
  const r = optionPeopleRule(o);
  if (r.kind === 'range') return t('optionRange', { min: r.min, max: r.max });
  if (r.kind === 'only') return t('optionOnly', { n: r.n });
  return t('optionFrom', { n: r.n });
}

/** 예약 카드 인원 아래 안내 — 최소 2명 이상이거나 최대 인원이 있을 때만. */
function OptionPeopleNote({ option }: { option: TourOption }) {
  const t = useTranslations('tourDetail');
  const r = optionPeopleRule(option);
  const text =
    r.kind === 'range'
      ? t('optionRangeNote', { name: option.name, min: r.min, max: r.max })
      : r.kind === 'only'
        ? t('optionOnlyNote', { name: option.name, n: r.n })
        : r.n > 1
          ? t('optionMinNote', { name: option.name, n: r.n })
          : '';
  return text ? <p className="mt-2 text-right text-xs text-white/60">{text}</p> : null;
}
