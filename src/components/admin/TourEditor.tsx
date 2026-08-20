'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTour } from '@/app/admin/tour-actions';
import { type TourDetail } from '@/lib/tour';
import MediaInput from './MediaInput';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 투어 상세 편집 폼 — 요약·이미지·소요·가격·포함·본문·공개. (목록은 코드 고정) */
export default function TourEditor({
  slug,
  detail,
  lang = 'ko',
  disabled = false
}: {
  slug: string;
  detail: TourDetail;
  /** 편집 대상 언어(ko/en/ja) — 언어별 키에 저장된다. */
  lang?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(detail.published);
  const [summary, setSummary] = useState(detail.summary);
  // 사진 목록 — 구 데이터(heroImage 1장)는 편집 시작 시점에 배열로 승격해서 보여준다.
  const [images, setImages] = useState<string[]>(
    detail.images.length ? detail.images : detail.heroImage ? [detail.heroImage] : []
  );
  const [duration, setDuration] = useState(detail.duration);
  const [price, setPrice] = useState(detail.price);
  const [included, setIncluded] = useState(detail.included);
  const [body, setBody] = useState(detail.body);
  const [saving, setSaving] = useState(false);
  const { status, show } = useSaveStatus();

  // 사진 목록 편집 헬퍼 — 인덱스 key 배열이므로 MediaInput 은 반드시 controlled 모드로 렌더한다.
  const patchImage = (i: number, url: string) =>
    setImages((arr) => arr.map((v, idx) => (idx === i ? url : v)));
  const removeImage = (i: number) => setImages((arr) => arr.filter((_, idx) => idx !== i));
  const addImage = () => setImages((arr) => [...arr, '']);
  const moveImage = (i: number, dir: -1 | 1) =>
    setImages((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = arr.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save() {
    setSaving(true);
    const cleanImages = images.map((u) => u.trim()).filter(Boolean);
    const res = await saveTour(
      slug,
      {
        published,
        summary,
        // 사진은 ko 탭에서만 편집(언어 공통) — en/ja 저장은 기존 값을 건드리지 않고 통과시킨다.
        heroImage: lang === 'ko' ? (cleanImages[0] ?? '') : detail.heroImage,
        images: lang === 'ko' ? cleanImages : detail.images,
        duration,
        price,
        included,
        body
      },
      lang
    );
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
          <label className={labelCls}>사진 목록</label>
          {lang === 'ko' ? (
            <>
              <p className="mt-1 text-xs text-muted">
                첫 번째 사진이 대표로 쓰입니다. 2장 이상이면 상세 페이지에서 스와이프 갤러리로
                표시됩니다. 모든 언어 공통 · 권장 5~8장 (많을수록 페이지가 무거워집니다)
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
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          disabled={disabled || i === 0}
                          aria-label="위로"
                          className="rounded border border-line px-1.5 text-sm text-ink hover:border-brand disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          disabled={disabled || i === images.length - 1}
                          aria-label="아래로"
                          className="rounded border border-line px-1.5 text-sm text-ink hover:border-brand disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          disabled={disabled}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <MediaInput
                        prefix="tours"
                        accept="image/*"
                        value={url}
                        disabled={disabled}
                        onChange={(u) => patchImage(i, u)}
                      />
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
