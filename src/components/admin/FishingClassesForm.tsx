'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveFishingClasses } from '@/app/admin/tour-actions';
import { type TourClasses, type FishingClassKey } from '@/lib/tour';
import MediaInput from './MediaInput';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

const CLASS_LABEL: Record<FishingClassKey, string> = { middle: '미들 클래스', luxury: '럭셔리 클래스' };

/**
 * 낚시 공통 클래스(미들/럭셔리) 편집 — 사진+설명.
 * 단일 저장소(fishing_classes)라 어느 낚시 투어 편집 화면에서 저장하든 4개 낚시 투어 상세에 모두 동기화된다.
 */
export default function FishingClassesForm({
  initial,
  disabled = false
}: {
  initial: TourClasses;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<TourClasses>(initial);
  const [saving, setSaving] = useState(false);
  const { status, show } = useSaveStatus();

  const patchClass = (key: FishingClassKey, p: Partial<TourClasses[FishingClassKey]>) =>
    setClasses((c) => ({ ...c, [key]: { ...c[key], ...p } }));

  async function save() {
    setSaving(true);
    const res = await saveFishingClasses(classes);
    setSaving(false);
    if (res.error) show(res.error, 'err');
    else {
      show('저장되었습니다. (모든 낚시 투어에 반영)');
      router.refresh();
    }
  }

  return (
    <div className="rounded-card border border-brand/40 bg-brand/[0.04] p-5 sm:p-6">
      <h3 className="text-sm font-bold text-ink">낚시 공통 클래스 (미들 / 럭셔리)</h3>
      <p className="mt-1 text-xs text-muted">
        이 클래스 내용은 <strong>모든 낚시 투어 4종에 공통 적용</strong>됩니다. 여기서 한 번만 수정하면
        4시간 체험낚시·6시간 5종낚시·1박2일 종일낚시·8시간 빅게임 트롤링 상세의 클래스 탭에 모두
        동일하게 반영됩니다. 비워 두면 해당 클래스 탭은 “준비 중”으로 표시됩니다.
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {(['middle', 'luxury'] as FishingClassKey[]).map((key) => (
          <div key={key} className="rounded-card border border-line bg-surface p-4">
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
              <label className={labelCls} htmlFor={`fc-desc-${key}`}>
                설명
              </label>
              <textarea
                id={`fc-desc-${key}`}
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

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '낚시 공통 클래스 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
