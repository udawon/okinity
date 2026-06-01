'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAbout } from '@/app/admin/about-actions';
import { type AboutContent, type Strength } from '@/lib/about';
import MediaInput from './MediaInput';

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';
const cardCls = 'rounded-card border border-line bg-surface p-5 sm:p-6';

export default function AboutEditor({
  defaults,
  disabled = false
}: {
  defaults: AboutContent;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [eyebrow, setEyebrow] = useState(defaults.eyebrow);
  const [title, setTitle] = useState(defaults.title);
  const [intro, setIntro] = useState(defaults.intro);
  const [heroImage, setHeroImage] = useState(defaults.heroImage);
  const [body, setBody] = useState(defaults.body);
  const [strengths, setStrengths] = useState<Strength[]>(
    defaults.strengths.length ? defaults.strengths : [{ title: '', desc: '' }]
  );
  const [instructorName, setInstructorName] = useState(defaults.instructorName);
  const [instructorRole, setInstructorRole] = useState(defaults.instructorRole);
  const [instructorPhoto, setInstructorPhoto] = useState(defaults.instructorPhoto);
  const [instructorCerts, setInstructorCerts] = useState(defaults.instructorCerts);
  const [instructorBody, setInstructorBody] = useState(defaults.instructorBody);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const setStrength = (i: number, key: keyof Strength, v: string) =>
    setStrengths((arr) => arr.map((s, j) => (j === i ? { ...s, [key]: v } : s)));
  const addStrength = () => setStrengths((arr) => [...arr, { title: '', desc: '' }]);
  const removeStrength = (i: number) => setStrengths((arr) => arr.filter((_, j) => j !== i));

  async function save() {
    setSaving(true);
    setMsg('');
    const res = await saveAbout({
      eyebrow,
      title,
      intro,
      heroImage,
      body,
      strengths: strengths.filter((s) => s.title.trim() || s.desc.trim()),
      instructorName,
      instructorRole,
      instructorPhoto,
      instructorCerts,
      instructorBody
    });
    setSaving(false);
    if (res.error) setMsg(res.error);
    else {
      setMsg('저장되었습니다.');
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className={cardCls}>
        <h3 className="mb-3 text-sm font-bold text-ink">상단 소개</h3>
        <div>
          <label className={labelCls} htmlFor="ab-eyebrow">
            작은 라벨 (eyebrow)
          </label>
          <input
            id="ab-eyebrow"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            disabled={disabled}
            className={inputCls}
          />
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="ab-title">
            제목
          </label>
          <p className="mb-1 mt-0.5 text-xs text-muted">
            줄바꿈 시 마지막 줄이 강조색(오션)으로 표시됩니다.
          </p>
          <textarea
            id="ab-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            disabled={disabled}
            className={`${inputCls} resize-y !rounded-card`}
          />
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="ab-intro">
            인트로 문단
          </label>
          <textarea
            id="ab-intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={3}
            disabled={disabled}
            className={`${inputCls} resize-y !rounded-card`}
          />
        </div>
        <div className="mt-4">
          <label className={labelCls}>대표 이미지</label>
          <div className="mt-1">
            <MediaInput
              prefix="about"
              accept="image/*"
              defaultUrl={heroImage}
              disabled={disabled}
              onChange={setHeroImage}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="ab-body">
            소개 본문 <span className="font-normal text-muted">(줄바꿈으로 단락 구분)</span>
          </label>
          <textarea
            id="ab-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            disabled={disabled}
            className={`${inputCls} resize-y !rounded-card`}
          />
        </div>
      </div>

      {/* 핵심 강점 */}
      <div className={cardCls}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">핵심 강점</h3>
          <button
            type="button"
            onClick={addStrength}
            disabled={disabled}
            className="rounded-button border border-line px-3 py-1.5 text-xs text-muted hover:text-ink disabled:opacity-50"
          >
            + 강점 추가
          </button>
        </div>
        <div className="space-y-4">
          {strengths.map((s, i) => (
            <div key={i} className="rounded-card border border-line p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">강점 {i + 1}</span>
                {strengths.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStrength(i)}
                    disabled={disabled}
                    className="text-xs text-muted hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
              </div>
              <input
                value={s.title}
                onChange={(e) => setStrength(i, 'title', e.target.value)}
                placeholder="강점 제목"
                disabled={disabled}
                className={inputCls}
              />
              <textarea
                value={s.desc}
                onChange={(e) => setStrength(i, 'desc', e.target.value)}
                placeholder="강점 설명"
                rows={2}
                disabled={disabled}
                className={`${inputCls} resize-y !rounded-card`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 강사 */}
      <div className={cardCls}>
        <h3 className="mb-3 text-sm font-bold text-ink">대표 강사</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="ab-iname">
              이름
            </label>
            <input
              id="ab-iname"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              disabled={disabled}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ab-irole">
              한 줄 소개 / 직함
            </label>
            <input
              id="ab-irole"
              value={instructorRole}
              onChange={(e) => setInstructorRole(e.target.value)}
              disabled={disabled}
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>강사 사진</label>
          <div className="mt-1">
            <MediaInput
              prefix="about"
              accept="image/*"
              defaultUrl={instructorPhoto}
              disabled={disabled}
              onChange={setInstructorPhoto}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="ab-icerts">
            자격증 <span className="font-normal text-muted">(줄바꿈 또는 쉼표로 구분)</span>
          </label>
          <textarea
            id="ab-icerts"
            value={instructorCerts}
            onChange={(e) => setInstructorCerts(e.target.value)}
            rows={3}
            disabled={disabled}
            className={`${inputCls} resize-y !rounded-card`}
          />
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="ab-ibody">
            강사 소개글
          </label>
          <textarea
            id="ab-ibody"
            value={instructorBody}
            onChange={(e) => setInstructorBody(e.target.value)}
            rows={5}
            disabled={disabled}
            className={`${inputCls} resize-y !rounded-card`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '소개 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
