import { splitRow, type BodyBlock } from '@/lib/tour-body';
import TourSteps from './TourSteps';
import Icon from './icons';

const PANEL = 'rounded-2xl border border-white/10 bg-[#061522]/60 backdrop-blur-md';

/** 여러 줄 텍스트(연속 줄 포함)를 줄바꿈 그대로. */
function Lines({ text }: { text: string }) {
  return <span className="whitespace-pre-line">{text}</span>;
}

function ListBlock({ block, accent }: { block: Extract<BodyBlock, { type: 'list' }>; accent: string }) {
  return (
    <ul className={`${PANEL} divide-y divide-white/10`}>
      {block.items.map((item, i) => {
        const row = block.ordered ? null : splitRow(item);
        return (
          <li key={i} className="flex gap-3 px-4 py-3.5 text-[15px] leading-relaxed text-white/85 sm:px-5">
            {block.ordered ? (
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-[#06202f]"
                style={{ backgroundColor: accent }}
              >
                {i + 1}
              </span>
            ) : (
              <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            )}
            {row ? (
              <span className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-4 gap-y-0.5">
                <span className="text-white/75">{row.label}</span>
                <span className="font-semibold text-white">{row.value}</span>
              </span>
            ) : (
              <span className="min-w-0">
                <Lines text={item} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 본문 블록 렌더러 — lib/tour-body 가 나눈 블록을 화면 요소로.
 * 문단·목록(표 행 자동 분리)·표·진행 흐름·경고/안내 박스·소제목.
 */
export default function TourBlocks({ blocks, accent }: { blocks: BodyBlock[]; accent: string }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'paragraph':
            return (
              <p key={i} className="text-[15px] leading-[1.85] text-white/85 sm:text-base">
                {b.lines.map((l, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {l}
                  </span>
                ))}
              </p>
            );
          case 'list':
            return <ListBlock key={i} block={b} accent={accent} />;
          case 'rows':
            return (
              <div key={i} className={`${PANEL} divide-y divide-white/10`}>
                {b.rows.map((r, j) => (
                  <div key={j} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-4 py-3.5 text-[15px] sm:px-5">
                    <span className="text-white/75">{r.label}</span>
                    <span className="font-semibold text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            );
          case 'steps':
            return (
              <div key={i} className={`${PANEL} px-4 py-5 sm:px-6`}>
                <TourSteps steps={b.steps} accent={accent} />
              </div>
            );
          case 'callout':
            return b.tone === 'warn' ? (
              <p
                key={i}
                className="flex gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3.5 text-[15px] leading-relaxed text-amber-50 sm:px-5"
              >
                <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span>{b.text}</span>
              </p>
            ) : (
              <p
                key={i}
                className="flex gap-3 rounded-2xl border border-[#5fc6ef]/30 bg-[#5fc6ef]/10 px-4 py-3.5 text-[15px] leading-relaxed text-white/90 sm:px-5"
              >
                <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-[#5fc6ef]" />
                <span>{b.text}</span>
              </p>
            );
          case 'subhead':
            return (
              <h3 key={i} className="pt-2 text-sm font-bold tracking-wide text-white/70">
                {b.text}
              </h3>
            );
        }
      })}
    </div>
  );
}
