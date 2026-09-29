'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveTour } from '@/app/admin/tour-actions';
import {
  extractAgeRange,
  tourHasClasses,
  PRICE_MODES,
  type PriceMode,
  type PriceTier,
  type TourDetail,
  type TourStepInput
} from '@/lib/tour';
import { isRuleSection, parseTourBody } from '@/lib/tour-body';
import { TOUR_NOTICE_IDS, type TourNoticeId } from '@/lib/tour-notices';
import { newOptionKey, type TourOption } from '@/lib/tour-options';
import MediaInput from './MediaInput';
import { useSaveStatus, SaveStatusBadge } from './save-status';
import { safeAction } from '@/lib/safe-action';
import { parseYenInput } from '@/lib/number-input';

const labelCls = 'block text-sm font-medium text-ink';
const hintCls = 'mt-1 text-xs text-muted';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';
const cardCls = 'rounded-card border border-line bg-surface p-5 sm:p-6';
const smallBtn =
  'rounded border border-line px-2 py-1 text-sm text-ink hover:border-brand disabled:opacity-30';

const PRICE_MODE_LABEL: Record<PriceMode, string> = {
  text: '가격 안내 글 그대로 (계산 없음)',
  perPerson: '1인당 요금 (+ 1인 단독 요금) — 스노클링 · 체험다이빙',
  boat: '배 1척 · 인원 구간별 — 낚시 · 요트',
  inquiry: '가격 문의'
};

const NOTICE_LABEL: Record<TourNoticeId, string> = {
  refund: '환불 · 위약금 규정',
  safety: '안전관리 안내'
};

/** 숫자 입력칸 문자열 → 숫자("13,000엔"도 허용, 빈 값·잘못된 값은 null — 잘못된 값은 저장 전에 막는다). */
function toNumber(v: string): number | null {
  return parseYenInput(v).value;
}

/** 옵션 편집 행 — 숫자 칸은 입력 중 문자열로 들고 있다가 저장할 때 숫자로 바꾼다. */
type OptionRow = { key: string; name: string; description: string; price: string; min: string; max: string };

/**
 * 투어 상세 편집 폼. (목록은 코드 고정)
 * 언어별로 저장되는 글(요약·소요·가격 글·연령·진행 순서·본문 등)과, 한국어 탭에서만 고치는
 * 언어 공통 값(사진·요금 숫자·공통 안내 켜기)을 나눠 다룬다.
 */
export default function TourEditor({
  slug,
  detail,
  lang = 'ko',
  baseOptions,
  disabled = false
}: {
  slug: string;
  detail: TourDetail;
  /** 한국어 저장본의 옵션 — en/ja 탭에서 옵션 목록(요금·순서)의 기준. 이 탭에선 이름·설명만 번역한다. */
  baseOptions?: TourOption[];
  /** 편집 대상 언어(ko/en/ja) — 언어별 키에 저장된다. */
  lang?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const isKo = lang === 'ko';
  const hasClasses = tourHasClasses(slug);
  const [published, setPublished] = useState(detail.published);
  const [summary, setSummary] = useState(detail.summary);
  // 사진 목록 — 구 데이터(heroImage 1장)는 편집 시작 시점에 배열로 승격해서 보여준다.
  const [images, setImages] = useState<string[]>(
    detail.images.length ? detail.images : detail.heroImage ? [detail.heroImage] : []
  );
  const [duration, setDuration] = useState(detail.duration);
  const [age, setAge] = useState(detail.age);
  const [people, setPeople] = useState(detail.people);
  const [startNote, setStartNote] = useState(detail.startNote);
  const [price, setPrice] = useState(detail.price);
  // 낚시 전용 — 클래스별 가격 글(클래스 카드·예약 카드에 표시).
  const [priceMiddle, setPriceMiddle] = useState(detail.priceMiddle);
  const [priceLuxury, setPriceLuxury] = useState(detail.priceLuxury);
  const [priceMode, setPriceMode] = useState<PriceMode>(detail.priceMode);
  const [pricePerPerson, setPricePerPerson] = useState(detail.pricePerPerson?.toString() ?? '');
  const [priceSolo, setPriceSolo] = useState(detail.priceSolo?.toString() ?? '');
  const [tiers, setTiers] = useState<{ cls: string; maxPeople: string; price: string }[]>(
    detail.priceTiers.map((t) => ({ cls: t.cls, maxPeople: String(t.maxPeople), price: String(t.price) }))
  );
  const [notices, setNotices] = useState<string[]>(detail.notices);
  // 선택 옵션 — ko 탭은 전부 편집, en/ja 탭은 한국어 옵션 목록 기준으로 이름·설명만 번역.
  const [options, setOptions] = useState<OptionRow[]>(() =>
    (isKo ? detail.options : (baseOptions ?? [])).map((o) => {
      const local = isKo ? o : detail.options.find((x) => x.key === o.key);
      return {
        key: o.key,
        name: local?.name ?? '',
        description: local?.description ?? '',
        price: o.pricePerPerson?.toString() ?? '',
        min: o.minPeople?.toString() ?? '',
        max: o.maxPeople?.toString() ?? ''
      };
    })
  );
  const patchOption = (i: number, patch: Partial<OptionRow>) =>
    setOptions((a) => a.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const [steps, setSteps] = useState<TourStepInput[]>(detail.steps);
  const [included, setIncluded] = useState(detail.included);
  const [body, setBody] = useState(detail.body);
  const [saving, setSaving] = useState(false);
  const { status, show, showSaved } = useSaveStatus();

  // 본문 자동 정리 결과 — 편집 중 바로 보여줘서 ★제목★ 표기가 어떻게 나뉘는지 확인하게 한다.
  const parsed = useMemo(() => parseTourBody(body), [body]);
  const bodySteps = useMemo(() => {
    for (const b of [...parsed.intro, ...parsed.sections.flatMap((s) => s.blocks)]) {
      if (b.type === 'steps') return b.steps;
    }
    return [];
  }, [parsed]);
  const autoAge = useMemo(() => extractAgeRange(body), [body]);

  // 사진 목록 편집 헬퍼 — 인덱스 key 배열이므로 MediaInput 은 반드시 controlled 모드로 렌더한다.
  const patchImage = (i: number, url: string) =>
    setImages((arr) => arr.map((v, idx) => (idx === i ? url : v)));
  const removeImage = (i: number) => setImages((arr) => arr.filter((_, idx) => idx !== i));
  const addImage = () => setImages((arr) => [...arr, '']);
  function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const next = arr.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }

  async function save() {
    // 1인당 요금 숫자 칸 — 읽을 수 없는 글("만삼천" 등)이 조용히 빈 값으로 저장되지 않게
    if (isKo && priceMode === 'perPerson' && (!parseYenInput(pricePerPerson).ok || !parseYenInput(priceSolo).ok)) {
      show('1인 요금·1인 단독 요금은 숫자로 입력해 주세요. 예) 13000', 'err');
      return;
    }
    // 구간 요금: 인원·요금이 모두 숫자인 행만 저장
    const cleanTiers: PriceTier[] = tiers
      .map((t) => ({ cls: t.cls, maxPeople: Math.round(toNumber(t.maxPeople) ?? 0), price: toNumber(t.price) ?? -1 }))
      .filter((t) => t.maxPeople > 0 && t.price >= 0);
    if (isKo && priceMode === 'boat' && tiers.length > cleanTiers.length) {
      show('요금 구간의 최대 인원과 요금을 숫자로 모두 입력해 주세요.', 'err');
      return;
    }
    // 옵션: 이름은 필수, 1인 요금·최소/최대 인원은 비우거나 숫자로(최대 ≥ 최소)
    const isPeople = (v: string) => /^([1-9]|[1-4]\d|50)$/.test(v.trim());
    const optionError = isKo
      ? options.some((o) => !o.name.trim())
        ? '옵션 이름을 모두 입력해 주세요. 쓰지 않는 옵션은 삭제해 주세요.'
        : options.some((o) => o.price.trim() && toNumber(o.price) == null)
          ? '옵션의 1인 요금은 숫자로 입력해 주세요.'
          : options.some((o) => (o.min.trim() && !isPeople(o.min)) || (o.max.trim() && !isPeople(o.max)))
            ? '옵션의 최소·최대 인원은 1~50 사이 숫자로 입력해 주세요.'
            : options.some((o) => o.max.trim() && Number(o.max) < (Number(o.min) || 1))
              ? '옵션의 최대 인원은 최소 인원보다 작을 수 없어요.'
              : null
      : null;
    if (optionError) {
      show(optionError, 'err');
      return;
    }
    const cleanOptions: TourOption[] = options.map((o) => ({
      key: o.key,
      name: o.name.trim(),
      description: o.description.trim(),
      // 요금·최소/최대 인원은 언어 공통(한국어 저장본만 사용) — 번역 탭에는 비워 둔다.
      pricePerPerson: isKo ? toNumber(o.price) : null,
      minPeople: isKo && o.min.trim() ? Number(o.min.trim()) : null,
      maxPeople: isKo && o.max.trim() ? Number(o.max.trim()) : null
    }));
    setSaving(true);
    const cleanImages = images.map((u) => u.trim()).filter(Boolean);
    const res = await safeAction(() => saveTour(
      slug,
      {
        // 공개 여부는 언어 공통(한국어 탭에서만 정함) — 번역 탭 저장은 기존 값을 통과시킨다.
        published: isKo ? published : detail.published,
        summary,
        // 사진·요금 숫자·공통 안내는 ko 탭에서만 편집(언어 공통) — en/ja 저장은 기존 값을 통과시킨다.
        heroImage: isKo ? (cleanImages[0] ?? '') : detail.heroImage,
        images: isKo ? cleanImages : detail.images,
        priceMode: isKo ? priceMode : detail.priceMode,
        pricePerPerson: isKo ? toNumber(pricePerPerson) : detail.pricePerPerson,
        priceSolo: isKo ? toNumber(priceSolo) : detail.priceSolo,
        priceTiers: isKo ? cleanTiers : detail.priceTiers,
        notices: isKo ? notices : detail.notices,
        options: cleanOptions,
        duration,
        age,
        people,
        startNote,
        price,
        priceMiddle,
        priceLuxury,
        included,
        steps: steps.map((s) => ({ name: s.name.trim(), time: s.time.trim() })).filter((s) => s.name),
        body
      },
      lang
    ));
    setSaving(false);
    if (res.error) show(res.error, 'err');
    else {
      showSaved('저장되었습니다.', res.sync);
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {/* ── 기본 정보 ── */}
      <section className={cardCls}>
        <h3 className="text-base font-bold text-ink">기본 정보</h3>
        {isKo ? (
          <label className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4"
            />
            상세 내용 공개 (체크 해제 시 상세 페이지는 기본 정보 + 예약 문의만 노출 · 모든 언어에 적용)
          </label>
        ) : (
          <p className="mt-3 rounded-card border border-line bg-bg/40 p-3 text-xs text-muted">
            공개 여부는 한국어 탭에서 정합니다. 모든 언어에 똑같이 적용돼요.
          </p>
        )}

        <div className="mt-4">
          <label className={labelCls} htmlFor="tour-summary">
            한 줄 요약
          </label>
          <input
            id="tour-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="예) 보트로 5분, 케라마 블루의 투명한 바다에서 즐기는 체험다이빙"
            disabled={disabled}
            className={inputCls}
          />
        </div>

        <p className="mt-5 text-sm font-semibold text-ink">요약 타일</p>
        <p className={hintCls}>제목 아래 네모 칸으로 보여요. 비워 둔 칸은 페이지에 나타나지 않아요.</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="tour-duration">
              소요 시간
            </label>
            <input
              id="tour-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="예) 약 2시간"
              disabled={disabled}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-age">
              참가 연령
            </label>
            <input
              id="tour-age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={autoAge ? `비우면 본문에서 자동: 만 ${autoAge.min}–${autoAge.max}세` : '예) 만 10–55세'}
              disabled={disabled}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-people">
              인원
            </label>
            <input
              id="tour-people"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="예) 2인부터 · 1인 단독 가능"
              disabled={disabled}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-start">
              출발 안내
            </label>
            <input
              id="tour-start"
              value={startNote}
              onChange={(e) => setStartNote(e.target.value)}
              placeholder="예) 08:00~12:00 사이 원하는 시간 출발"
              disabled={disabled}
              className={inputCls}
            />
            <p className={hintCls}>
              <Link href="/admin/tour-times" className="text-brand hover:underline">
                투어 시간대
              </Link>
              가 입력돼 있으면 그 시간이 우선 표시돼요.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className={labelCls}>사진 목록</label>
          {isKo ? (
            <>
              <p className={hintCls}>
                첫 번째 사진이 대표로 쓰입니다(가장 크게 보이는 자리라 가로 사진 권장). 2장 이상이면 PC에서
                모자이크, 휴대폰에서 스와이프로 보여요. 가로·세로 사진 모두 올릴 수 있고, 세로 사진은 잘리지
                않고 전체가 보여요. 모든 언어 공통 · 권장 5~8장
              </p>
              <div className="mt-2 space-y-3">
                {images.map((url, i) => (
                  <div key={i} className="rounded-card border border-line bg-bg/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        #{i + 1}
                        {i === 0 && (
                          <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">
                            대표
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setImages((a) => move(a, i, -1))} disabled={disabled || i === 0} aria-label="위로" className={smallBtn}>
                          ↑
                        </button>
                        <button type="button" onClick={() => setImages((a) => move(a, i, 1))} disabled={disabled || i === images.length - 1} aria-label="아래로" className={smallBtn}>
                          ↓
                        </button>
                        <button type="button" onClick={() => removeImage(i)} disabled={disabled} className="text-sm text-red-600 hover:underline disabled:opacity-50">
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <MediaInput prefix="tours" accept="image/*" value={url} disabled={disabled} onChange={(u) => patchImage(i, u)} />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImage}
                  disabled={disabled}
                  className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-50"
                >
                  + 사진 추가
                </button>
              </div>
            </>
          ) : (
            <p className="mt-1 rounded-card border border-line bg-bg/40 p-3 text-xs text-muted">
              사진은 한국어 탭에서 관리합니다. 모든 언어에 공통으로 적용됩니다.
            </p>
          )}
        </div>
      </section>

      {/* ── 요금 ── */}
      <section className={cardCls}>
        <h3 className="text-base font-bold text-ink">요금</h3>
        <div className="mt-3">
          <label className={labelCls} htmlFor="tour-price">
            가격 안내 글
          </label>
          <input
            id="tour-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예) 1인 13,000엔(2인 이상) / 1인 단독 16,000엔"
            disabled={disabled}
            className={inputCls}
          />
          <p className={hintCls}>요금 방식이 ‘글 그대로’이거나 숫자가 비어 있을 때 예약 카드에 이 글이 보여요.</p>
        </div>

        {hasClasses && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="tour-price-middle">
                미들 클래스 가격 글
              </label>
              <input id="tour-price-middle" value={priceMiddle} onChange={(e) => setPriceMiddle(e.target.value)} placeholder="예) 130,000~150,000엔" disabled={disabled} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="tour-price-luxury">
                럭셔리 클래스 가격 글
              </label>
              <input id="tour-price-luxury" value={priceLuxury} onChange={(e) => setPriceLuxury(e.target.value)} placeholder="예) 250,000엔" disabled={disabled} className={inputCls} />
            </div>
          </div>
        )}

        <div className="mt-5 rounded-card border border-line bg-bg/40 p-4">
          <label className={labelCls} htmlFor="tour-price-mode">
            요금 방식 <span className="font-normal text-muted">(모든 언어 공통)</span>
          </label>
          {isKo ? (
            <>
              <select
                id="tour-price-mode"
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value as PriceMode)}
                disabled={disabled}
                className={inputCls}
              >
                {PRICE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PRICE_MODE_LABEL[m]}
                  </option>
                ))}
              </select>
              <p className={hintCls}>숫자로 입력하면 예약 카드가 인원을 고를 때마다 예상 합계(와 원화 참고 금액)를 계산해요.</p>

              {priceMode === 'perPerson' && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls} htmlFor="tour-ppp">
                      1인 요금 <span className="font-normal text-muted">(2인 이상, 엔)</span>
                    </label>
                    <input id="tour-ppp" inputMode="numeric" value={pricePerPerson} onChange={(e) => setPricePerPerson(e.target.value)} placeholder="13000" disabled={disabled} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="tour-solo">
                      1인 단독 참가 요금 <span className="font-normal text-muted">(엔, 없으면 비움)</span>
                    </label>
                    <input id="tour-solo" inputMode="numeric" value={priceSolo} onChange={(e) => setPriceSolo(e.target.value)} placeholder="16000" disabled={disabled} className={inputCls} />
                  </div>
                </div>
              )}

              {priceMode === 'boat' && (
                <div className="mt-3">
                  <p className="text-xs text-muted">
                    “최대 몇 명까지 얼마”로 구간을 적어요. 예) 1~5명 130,000엔 → 최대 인원 5 · 요금 130000
                  </p>
                  <div className="mt-2 space-y-2">
                    {tiers.map((tier, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        {hasClasses && (
                          <select
                            aria-label={`구간 ${i + 1} 클래스`}
                            value={tier.cls}
                            onChange={(e) => setTiers((a) => a.map((t, j) => (j === i ? { ...t, cls: e.target.value } : t)))}
                            disabled={disabled}
                            className="rounded-button border border-line bg-surface px-3 py-2 text-sm"
                          >
                            <option value="">모든 클래스</option>
                            <option value="middle">미들</option>
                            <option value="luxury">럭셔리</option>
                          </select>
                        )}
                        <span className="text-sm text-muted">최대</span>
                        <input
                          aria-label={`구간 ${i + 1} 최대 인원`}
                          inputMode="numeric"
                          value={tier.maxPeople}
                          onChange={(e) => setTiers((a) => a.map((t, j) => (j === i ? { ...t, maxPeople: e.target.value } : t)))}
                          disabled={disabled}
                          className="w-20 rounded-button border border-line bg-surface px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-muted">명까지</span>
                        <input
                          aria-label={`구간 ${i + 1} 요금`}
                          inputMode="numeric"
                          value={tier.price}
                          onChange={(e) => setTiers((a) => a.map((t, j) => (j === i ? { ...t, price: e.target.value } : t)))}
                          disabled={disabled}
                          className="w-32 rounded-button border border-line bg-surface px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-muted">엔</span>
                        <button type="button" onClick={() => setTiers((a) => a.filter((_, j) => j !== i))} disabled={disabled} className="text-sm text-red-600 hover:underline">
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTiers((a) => [...a, { cls: '', maxPeople: '', price: '' }])}
                      disabled={disabled}
                      className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand"
                    >
                      + 구간 추가
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className={hintCls}>요금 숫자는 한국어 탭에서 관리합니다. 모든 언어에 공통으로 적용됩니다.</p>
          )}
        </div>

        {!hasClasses && (
          <div className="mt-5 rounded-card border border-line bg-bg/40 p-4">
            <p className="text-sm font-semibold text-ink">
              선택 옵션 <span className="font-normal text-muted">(선택 입력)</span>
            </p>
            <p className={hintCls}>
              한 투어를 방식별로 나눠 손님이 고르게 해요(예: 일반 / 프라이빗). <b>2개 이상</b> 넣으면 투어 페이지에 옵션
              카드가, 예약 폼에 옵션 칸이 생겨요. 옵션에 1인 요금을 넣으면 예약 카드는 위 요금 방식 대신
              “옵션 1인 요금 × 인원”으로 계산하고, 최소~최대 인원 밖으로는 고를 수 없어요(1인 단독 옵션은 최소·최대 모두 1).
              맨 위 옵션이 처음에 선택돼 있어요.
            </p>
            {!isKo && (
              <p className={hintCls}>
                이 탭에서는 옵션 이름·설명만 번역해요. 옵션 추가·삭제·순서·요금·최소/최대 인원은 한국어 탭에서 합니다.
              </p>
            )}
            <div className="mt-3 space-y-3">
              {options.map((o, i) => (
                <div key={o.key} className="rounded-card border border-line bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      옵션 {i + 1}
                      {!isKo && baseOptions?.[i] && (
                        <span className="ml-2 text-xs font-normal text-muted">한국어: {baseOptions[i].name}</span>
                      )}
                    </span>
                    {isKo && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setOptions((a) => move(a, i, -1))} disabled={disabled || i === 0} aria-label="위로" className={smallBtn}>
                          ↑
                        </button>
                        <button type="button" onClick={() => setOptions((a) => move(a, i, 1))} disabled={disabled || i === options.length - 1} aria-label="아래로" className={smallBtn}>
                          ↓
                        </button>
                        <button type="button" onClick={() => setOptions((a) => a.filter((_, j) => j !== i))} disabled={disabled} className="text-sm text-red-600 hover:underline disabled:opacity-50">
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={`mt-2 grid gap-3 ${isKo ? 'sm:grid-cols-[minmax(0,1fr)_8rem_5.5rem_5.5rem]' : ''}`}>
                    <div>
                      <label className="block text-xs font-medium text-muted" htmlFor={`opt-name-${o.key}`}>
                        이름
                      </label>
                      <input
                        id={`opt-name-${o.key}`}
                        value={o.name}
                        onChange={(e) => patchOption(i, { name: e.target.value })}
                        placeholder={isKo ? '예) 일반' : baseOptions?.[i]?.name}
                        maxLength={30}
                        disabled={disabled}
                        className={inputCls}
                      />
                    </div>
                    {isKo && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-muted" htmlFor={`opt-price-${o.key}`}>
                            1인 요금(엔)
                          </label>
                          <input
                            id={`opt-price-${o.key}`}
                            inputMode="numeric"
                            value={o.price}
                            onChange={(e) => patchOption(i, { price: e.target.value })}
                            placeholder="6000"
                            disabled={disabled}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted" htmlFor={`opt-min-${o.key}`}>
                            최소 인원
                          </label>
                          <input
                            id={`opt-min-${o.key}`}
                            inputMode="numeric"
                            value={o.min}
                            onChange={(e) => patchOption(i, { min: e.target.value })}
                            placeholder="1"
                            disabled={disabled}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted" htmlFor={`opt-max-${o.key}`}>
                            최대 인원
                          </label>
                          <input
                            id={`opt-max-${o.key}`}
                            inputMode="numeric"
                            value={o.max}
                            onChange={(e) => patchOption(i, { max: e.target.value })}
                            placeholder="제한 없음"
                            disabled={disabled}
                            className={inputCls}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-muted" htmlFor={`opt-desc-${o.key}`}>
                      설명 <span className="font-normal">(줄마다 한 항목)</span>
                    </label>
                    <textarea
                      id={`opt-desc-${o.key}`}
                      value={o.description}
                      onChange={(e) => patchOption(i, { description: e.target.value })}
                      placeholder={isKo ? '예) 다른 팀과 함께 탑승\n가장 합리적인 요금' : baseOptions?.[i]?.description}
                      rows={2}
                      disabled={disabled}
                      className={`${inputCls} resize-y !rounded-card`}
                    />
                  </div>
                </div>
              ))}
              {isKo && (
                <button
                  type="button"
                  onClick={() =>
                    setOptions((a) => [...a, { key: newOptionKey(a.map((o) => o.key)), name: '', description: '', price: '', min: '', max: '' }])
                  }
                  disabled={disabled}
                  className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-50"
                >
                  + 옵션 추가
                </button>
              )}
              {!isKo && options.length === 0 && (
                <p className="text-xs text-muted">한국어 탭에 등록된 옵션이 없어요.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── 포함 사항 · 진행 순서 ── */}
      <section className={cardCls}>
        <label className={labelCls} htmlFor="tour-included">
          포함 사항 <span className="font-normal text-muted">(줄마다 한 항목 · 한 줄로 쓰면 쉼표로 구분)</span>
        </label>
        <textarea
          id="tour-included"
          value={included}
          onChange={(e) => setIncluded(e.target.value)}
          placeholder={'장비 일체\n한국어 가이드\n수중 사진 원본\n숙소 픽업'}
          rows={4}
          disabled={disabled}
          className={`${inputCls} resize-y !rounded-card`}
        />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">진행 순서</p>
            <p className={hintCls}>
              입력하면 “투어는 이렇게 진행돼요” 그림으로 보여요(본문의 ‘→’ 흐름 그림은 자동으로 숨김). 비워 두면 본문의 ‘→’ 흐름을 그 자리에 그대로 보여줘요.
            </p>
          </div>
          {bodySteps.length > 0 && steps.length === 0 && (
            <button
              type="button"
              onClick={() => setSteps(bodySteps.map((s) => ({ name: s.name, time: s.time })))}
              disabled={disabled}
              className="rounded-button border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5"
            >
              본문의 흐름({bodySteps.length}단계) 불러오기
            </button>
          )}
        </div>
        <div className="mt-2 space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-center text-sm font-semibold text-muted">{i + 1}</span>
              <input
                aria-label={`${i + 1}단계 이름`}
                value={s.name}
                onChange={(e) => setSteps((a) => a.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder="예) 지정 장소 집합"
                disabled={disabled}
                className="min-w-0 flex-1 rounded-button border border-line bg-surface px-3 py-2 text-sm"
              />
              <input
                aria-label={`${i + 1}단계 소요`}
                value={s.time}
                onChange={(e) => setSteps((a) => a.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                placeholder="약 30분"
                disabled={disabled}
                className="w-28 rounded-button border border-line bg-surface px-3 py-2 text-sm"
              />
              <button type="button" onClick={() => setSteps((a) => move(a, i, -1))} disabled={disabled || i === 0} aria-label="위로" className={smallBtn}>
                ↑
              </button>
              <button type="button" onClick={() => setSteps((a) => move(a, i, 1))} disabled={disabled || i === steps.length - 1} aria-label="아래로" className={smallBtn}>
                ↓
              </button>
              <button type="button" onClick={() => setSteps((a) => a.filter((_, j) => j !== i))} disabled={disabled} className="text-sm text-red-600 hover:underline">
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps((a) => [...a, { name: '', time: '' }])}
            disabled={disabled}
            className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand"
          >
            + 단계 추가
          </button>
        </div>
      </section>

      {/* ── 공통 안내 ── */}
      <section className={cardCls}>
        <p className="text-sm font-semibold text-ink">
          공통 안내 붙이기 <span className="font-normal text-muted">(모든 언어 공통)</span>
        </p>
        <p className={hintCls}>
          켜면 <Link href="/admin/tour-notices" className="text-brand hover:underline">공통 안내</Link>에서 한 번 작성한
          규정이 이 투어 페이지 아래에 붙어요. 이때 본문에 같은 주제의 ★제목★ 섹션(예: ★환불 규정★)이 있으면
          중복되지 않게 그 섹션은 숨겨요.
        </p>
        {isKo ? (
          <div className="mt-3 flex flex-wrap gap-4">
            {TOUR_NOTICE_IDS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={notices.includes(id)}
                  onChange={(e) =>
                    setNotices((a) => (e.target.checked ? [...a.filter((x) => x !== id), id] : a.filter((x) => x !== id)))
                  }
                  disabled={disabled}
                  className="h-4 w-4"
                />
                {NOTICE_LABEL[id]}
              </label>
            ))}
          </div>
        ) : (
          <p className={hintCls}>켜고 끄기는 한국어 탭에서 합니다.</p>
        )}
      </section>

      {/* ── 상세 본문 ── */}
      <section className={cardCls}>
        <label className={labelCls} htmlFor="tour-body">
          상세 본문
        </label>
        <details className="mt-1 text-xs text-muted">
          <summary className="cursor-pointer text-brand">표기법 보기 — 이렇게 쓰면 페이지에서 자동으로 정리돼요</summary>
          <ul className="mt-2 space-y-1 rounded-card border border-line bg-bg/40 p-3 leading-relaxed">
            <li><code>★제목★</code> → 섹션 제목 (환불·안전·규정이 들어간 제목은 아래 ‘규정 안내’에 접혀서 보여요)</li>
            <li><code>*항목</code> 또는 <code>-항목</code> → 목록 · 바로 다음 줄은 같은 항목으로 이어져요</li>
            <li><code>1. 항목</code> → 번호 목록 · <code>!문장!</code> → 노란 경고 박스 · <code>@문장</code> → 안내 박스(짧으면 소제목)</li>
            <li><code>이름 : 값</code>, <code>설명 130,000엔</code> → 표 · <code>-소제목-</code> → 소제목</li>
            <li><code>A -&gt; B(약 30분) -&gt; C</code> → 진행 흐름 그림</li>
          </ul>
        </details>
        <textarea
          id="tour-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="투어 진행 과정, 일정, 준비물, 유의사항 등 (줄바꿈 가능)"
          rows={16}
          disabled={disabled}
          className={`${inputCls} resize-y !rounded-card`}
        />
        {parsed.sections.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="text-muted">페이지에 나뉘는 섹션:</span>
            {parsed.sections.map((s, i) => (
              <span
                key={i}
                className={`rounded-full px-2 py-0.5 ${isRuleSection(s.title) ? 'bg-amber-100 text-amber-800' : 'bg-brand/10 text-brand'}`}
              >
                {s.title}
                {isRuleSection(s.title) ? ' · 규정' : ''}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 border-t border-line bg-bg/95 px-1 py-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '투어 상세 저장'}
        </button>
        <SaveStatusBadge status={status} />
        <a
          href={`/${lang}/tours/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm text-muted hover:text-ink"
        >
          공개 페이지 보기 ↗
        </a>
      </div>
    </div>
  );
}
