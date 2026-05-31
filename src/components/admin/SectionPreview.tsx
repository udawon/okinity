import { type ReactNode } from 'react';

/**
 * 어드민 편집 섹션 옆에 표시하는 "랜딩 적용 위치" 미니 와이어프레임.
 * 홈(랜딩) 섹션 순서를 작은 박스로 쌓아 보여주고, 지금 편집 중인 영역을 강조한다.
 * highlight 가 홈 섹션 키와 일치하면 그 박스를 강조. (products 처럼 홈 밖이면 note 로 안내)
 */

type HomeKey = 'hero' | 'blog' | 'tours' | 'assurance' | 'gallery' | 'reviews' | 'schedule';

const HOME_SECTIONS: { key: HomeKey; label: string; tall?: boolean }[] = [
  { key: 'hero', label: 'Hero (첫 화면)', tall: true },
  { key: 'blog', label: '블로그' },
  { key: 'tours', label: '투어 카테고리' },
  { key: 'assurance', label: '신뢰 배지' },
  { key: 'gallery', label: '갤러리' },
  { key: 'reviews', label: '후기' },
  { key: 'schedule', label: '일정 · 예약' }
];

export default function SectionPreview({
  highlight,
  note
}: {
  highlight?: HomeKey;
  note?: ReactNode;
}) {
  return (
    <div className="w-full lg:max-w-[220px]">
      <p className="mb-2 text-xs font-semibold text-muted">랜딩 적용 위치</p>

      {/* 홈 페이지 미니 목업 */}
      <div className="overflow-hidden rounded-card border border-line bg-bg p-2">
        {/* 헤더 바 */}
        <div className="mb-1.5 flex h-4 items-center gap-1 rounded bg-ink/85 px-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-surface/70" />
          <span className="ml-auto h-1 w-8 rounded bg-surface/40" />
        </div>

        <div className="space-y-1.5">
          {HOME_SECTIONS.map((s) => {
            const on = s.key === highlight;
            return (
              <div
                key={s.key}
                className={`flex items-center justify-center rounded px-1 text-center text-[10px] font-medium leading-tight transition-colors ${
                  s.tall ? 'h-9' : 'h-6'
                } ${
                  on
                    ? 'bg-brand text-brand-contrast ring-2 ring-brand ring-offset-1 ring-offset-bg'
                    : 'border border-line bg-surface text-muted'
                }`}
              >
                {s.label}
                {on && <span className="ml-1">←</span>}
              </div>
            );
          })}
        </div>
      </div>

      {note && <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
