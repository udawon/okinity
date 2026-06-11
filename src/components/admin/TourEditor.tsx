'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTour } from '@/app/admin/tour-actions';
import { emptyTourClasses, type TourClasses, type FishingClassKey, type TourDetail } from '@/lib/tour';
import MediaInput from './MediaInput';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

const CLASS_LABEL: Record<FishingClassKey, string> = { middle: '미들 클래스', luxury: '럭셔리 클래스' };

/**
 * 투어 상세 편집 폼 — 요약·이미지·소요·가격·포함·본문·공개. (목록은 코드 고정)
 * showClasses(낚시)면 미들/럭셔리 클래스별 사진+설명 편집 블록을 추가로 노출한다.
 */
export default function TourEditor({
  slug,
  detail,
  disabled = false,
  showClasses = false
}: {
  slug: string;
  detail: TourDetail;
  disabled?: boolean;
  showClasses?: boolean;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(detail.published);
  const [summary, setSummary] = useState(detail.summary);
  const [heroImage, setHeroImage] = useState(detail.heroImage);
  const [duration, setDuration] = useState(detail.duration);
  const [price, setPrice] = useState(detail.price);
  const [included, setIncluded] = useState(detail.included);
  const [body, setBody] = useState(detail.body);
  const [classes, setClasses] = useState<TourClasses>(detail.classes ?? emptyTourClasses());
  const [saving, setSaving] = useState(false);
  const { status, show } = useSaveStatus();

  const patchClass = (key: FishingClassKey, p: Partial<TourClasses[FishingClassKey]>) =>
    setClasses((c) => ({ ...c, [key]: { ...c[key], ...p } }));

  async function save() {
    setSaving(true);
    const res = await saveTour(slug, {
      published,
      summary,
      heroImage,
      duration,
      price,
      included,
      body,
      classes
    });
    setSaving(false);
    if (res.error) show(res.error, 'err');
    else {
      show('저장되었습니다.');
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4"
          />
          상세 내용 공개 (체크 해제 시 상세 페이지는 기본 정보 + 예약 문의만 노출)
        </label>

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

        <div className="mt-4">
          <label className={labelCls}>상단 이미지</label>
          <div className="mt-1">
            <MediaInput
              prefix="tours"
              accept="image/*"
              defaultUrl={heroImage}
              disabled={disabled}
              onChange={setHeroImage}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="tour-duration">
              소요 시간
            </label>
            <input
              id="tour-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="예) 약 3시간 (반일)"
              disabled={disabled}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-price">
              가격 안내
            </label>
            <input
              id="tour-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예) 1인 12,000엔부터"
              disabled={disabled}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="tour-included">
            포함 사항 <span className="font-normal text-muted">(줄바꿈 또는 쉼표로 구분)</span>
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
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
        <label className={labelCls} htmlFor="tour-body">
          상세 본문
        </label>
        <textarea
          id="tour-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="투어 진행 과정, 일정, 준비물, 유의사항 등 (줄바꿈 가능)"
          rows={12}
          disabled={disabled}
          className={`${inputCls} resize-y !rounded-card`}
        />
      </div>

      {/* 낚시 클래스(소분류) — 미들/럭셔리별 사진+설명. 상세페이지 '클래스' 탭에 노출. */}
      {showClasses && (
        <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-bold text-ink">클래스 (미들 / 럭셔리)</h3>
          <p className="mt-1 text-xs text-muted">
            소분류는 별도 페이지 없이 이 투어 상세의 <strong>클래스 탭</strong>에 사진·설명으로
            노출됩니다. 비워 두면 해당 클래스 탭은 “준비 중”으로 표시됩니다.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {(['middle', 'luxury'] as FishingClassKey[]).map((key) => (
              <div key={key} className="rounded-card border border-line bg-bg/40 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="h-3.5 w-1 rounded-full bg-brand" aria-hidden />
                  {CLASS_LABEL[key]}
                </p>
                <div className="mt-3">
                  <label className={labelCls}>사진</label>
                  <div className="mt-1">
                    <MediaInput
                      prefix="tours"
                      accept="image/*"
                      defaultUrl={classes[key].image}
                      disabled={disabled}
                      onChange={(url) => patchClass(key, { image: url })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls} htmlFor={`class-desc-${key}`}>
                    설명
                  </label>
                  <textarea
                    id={`class-desc-${key}`}
                    value={classes[key].description}
                    onChange={(e) => patchClass(key, { description: e.target.value })}
                    placeholder={`${CLASS_LABEL[key]} 구성·차별점·요금 안내 등 (줄바꿈 가능)`}
                    rows={5}
                    disabled={disabled}
                    className={`${inputCls} resize-y !rounded-card`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '투어 상세 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
