import type { TourStep } from '@/lib/tour-body';

/**
 * 진행 순서 그림 — 번호 원 + 단계명 + 소요 시간.
 * 6단계 이하는 태블릿 이상에서 가로 흐름, 그보다 많거나 모바일이면 세로 타임라인.
 */
export default function TourSteps({ steps, accent }: { steps: TourStep[]; accent: string }) {
  if (!steps.length) return null;
  const horizontal = steps.length <= 6;
  return (
    <ol
      className={`relative ${
        horizontal
          ? 'grid gap-4 sm:grid-flow-col sm:auto-cols-fr sm:gap-2'
          : 'grid gap-4'
      }`}
    >
      {steps.map((s, i) => (
        <li
          key={`${i}-${s.name}`}
          className={`relative flex gap-3 ${horizontal ? 'sm:flex-col sm:items-center sm:text-center' : ''}`}
        >
          {/* 단계 사이 연결선 */}
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute bg-white/15 ${
                horizontal
                  ? 'left-[15px] top-8 h-[calc(100%-8px)] w-px sm:left-[calc(50%+18px)] sm:top-[15px] sm:h-px sm:w-[calc(100%-28px)]'
                  : 'left-[15px] top-8 h-[calc(100%-8px)] w-px'
              }`}
            />
          )}
          <span
            className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold"
            style={{ borderColor: accent, color: accent, backgroundColor: 'rgba(6,21,34,0.9)' }}
          >
            {i + 1}
          </span>
          <span className="min-w-0 pt-1 sm:pt-0">
            <span className="block text-[15px] font-semibold leading-snug text-white">{s.name}</span>
            {s.time && <span className="mt-0.5 block text-[13px] text-white/60">{s.time}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
