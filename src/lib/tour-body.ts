/**
 * 투어 상세 본문 자동 서식 — 운영자가 어드민 '상세 본문'에 쓰는 표기 습관을 해석해
 * 제목·목록·표·경고·진행 흐름 블록으로 나눈다. 범용 순수 모듈(서버/클라 공용).
 *
 * 표기 규칙(2026-09 운영 데이터 기준, ko/en/ja 공통):
 *   ★제목★          → 섹션 제목 (앞부분은 intro)
 *   *항목 / -항목    → 목록 (바로 다음의 표시 없는 줄은 같은 항목의 연속 줄)
 *   1. 항목          → 번호 목록
 *   !문장!           → 경고 박스   (일본어 전각 ＊ ！ ＠ 도 동일)
 *   @짧은글 / @긴글   → 소제목 / 안내 박스
 *   -소제목-          → 소제목
 *   이름 : 값, 설명 1,000엔 → 표(행)
 *   A -> B -> C      → 진행 흐름(괄호 속은 소요 시간)
 *
 * 원칙: 규칙에 맞지 않는 줄은 일반 문단으로 남긴다 — 어떤 글자도 버리지 않는다.
 */

export type TourStep = { name: string; time: string };
export type BodyRow = { label: string; value: string };

export type BodyBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'rows'; rows: BodyRow[] }
  | { type: 'steps'; steps: TourStep[] }
  | { type: 'callout'; tone: 'warn' | 'note'; text: string }
  | { type: 'subhead'; text: string };

export type BodySection = { title: string; blocks: BodyBlock[] };
export type ParsedBody = { intro: BodyBlock[]; sections: BodySection[] };

const TITLE_RE = /^★\s*(.+?)\s*★$/;
const ARROW_SPLIT_RE = /\s*(?:->|→|⇒)\s*/;
const WARN_RE = /^[!！]\s*(.+?)\s*[!！]?$/;
const NOTE_RE = /^[@＠]\s*(.+)$/;
const DASH_SUBHEAD_RE = /^[-－]\s*([^-－\s].{0,19}?)\s*[-－]$/;
const BULLET_RE = /^(?:[*＊•·・]|[-－](?!>))\s*(.+)$/;
const NUMBERED_RE = /^\d{1,2}[.)．](?!\d)\s*(.+)$/;
const PRICE_END_RE = /^(.{2,30}?)\s+(\+?[\d,]{3,}\s*(?:엔|円|yen|JPY))$/i;
const COLON_ROW_RE = /^([^:：]{1,32}?)\s*(?::\s+|：\s*)(.+)$/;
const HAS_LETTER_RE = /[가-힣A-Za-z぀-ヿ一-鿿]/;
const SENTENCE_END_RE = /[.!?。．！？:：]$/;
const KOREAN_END_RE = /(다|요|죠|까)$/;
const STEP_TIME_RE = /^(.*?)\s*[(（]([^()（）]*)[)）]\s*$/;

/** 소제목으로 쓰는 @글의 최대 길이 — 이보다 길면 안내 박스. */
const NOTE_SUBHEAD_MAX = 15;
/** 목록 바로 앞에서 소제목으로 볼 줄의 최대 길이. */
const LABEL_MAX = 30;
/** 짧은 줄 문단을 목록으로 볼 때의 줄 최대 길이. */
const SHORT_LINE_MAX = 25;

/** 일반 줄로 두면 목록이 되는 섹션(준비물·지참). */
const LIST_SECTION_RE = /지참|준비물|챙겨|持ち物|準備|bring/i;
/** 접어서 보여줄 규정 성격의 섹션. */
const RULE_SECTION_RE = /환불|위약|안전|규정|취소|refund|cancel|safety|policy|penalt|キャンセル|返金|規定|安全|違約/i;

export function isRuleSection(title: string): boolean {
  return RULE_SECTION_RE.test(title);
}

/** "이름 : 값" 형태면 분리(목록 항목 표 렌더용). 시각(09:00)·문장은 null. */
export function splitRow(text: string): BodyRow | null {
  const m = COLON_ROW_RE.exec(text.trim());
  if (!m) return null;
  const label = m[1].trim();
  const value = m[2].trim();
  if (!label || !value || !HAS_LETTER_RE.test(label) || /\d$/.test(label)) return null;
  return { label, value };
}

function priceRow(text: string): BodyRow | null {
  const m = PRICE_END_RE.exec(text);
  if (!m || !HAS_LETTER_RE.test(m[1])) return null;
  return { label: m[1].trim(), value: m[2].trim() };
}

function parseSteps(line: string): TourStep[] | null {
  const parts = line.split(ARROW_SPLIT_RE).map((p) => p.trim());
  if (parts.length < 3 || parts.some((p) => !p)) return null;
  return parts.map((p) => {
    const m = STEP_TIME_RE.exec(p);
    if (!m || !m[1].trim()) return { name: p, time: '' };
    return { name: m[1].trim(), time: m[2].trim().replace(/^약\s*(?=\d)/, '약 ') };
  });
}

function isLabelLike(line: string): boolean {
  return line.length <= LABEL_MAX && !SENTENCE_END_RE.test(line);
}

type LineKind = 'blank' | 'item' | 'row' | 'plain' | 'other';

/** 한 섹션(또는 intro)의 줄들을 블록으로. */
function parseLines(lines: string[]): BodyBlock[] {
  const out: BodyBlock[] = [];
  let current: BodyBlock | null = null;
  let last: LineKind = 'blank';

  const flush = () => {
    if (current) out.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      last = 'blank';
      continue;
    }

    const steps = parseSteps(line);
    if (steps) {
      flush();
      out.push({ type: 'steps', steps });
      last = 'other';
      continue;
    }

    const warn = /^[!！]/.test(line) ? WARN_RE.exec(line) : null;
    if (warn) {
      flush();
      out.push({ type: 'callout', tone: 'warn', text: warn[1] });
      last = 'other';
      continue;
    }

    const note = NOTE_RE.exec(line);
    if (note) {
      flush();
      const text = note[1].trim();
      out.push(
        text.length <= NOTE_SUBHEAD_MAX ? { type: 'subhead', text } : { type: 'callout', tone: 'note', text }
      );
      last = 'other';
      continue;
    }

    const dashHead = DASH_SUBHEAD_RE.exec(line);
    if (dashHead) {
      flush();
      out.push({ type: 'subhead', text: dashHead[1].trim() });
      last = 'other';
      continue;
    }

    const numbered = NUMBERED_RE.exec(line);
    const bullet = numbered ? null : BULLET_RE.exec(line);
    if (numbered || bullet) {
      const ordered = Boolean(numbered);
      const text = (numbered ?? bullet)![1].trim();
      const cur = current as BodyBlock | null;
      if (cur?.type === 'list' && cur.ordered === ordered) {
        cur.items.push(text);
      } else {
        // 목록 바로 앞(빈 줄 없이)의 짧은 제목형 줄 → 소제목
        if (cur?.type === 'paragraph' && last === 'plain' && isLabelLike(cur.lines[cur.lines.length - 1])) {
          const label = cur.lines.pop()!;
          if (cur.lines.length) out.push(cur);
          out.push({ type: 'subhead', text: label });
          current = null;
        } else {
          flush();
        }
        current = { type: 'list', ordered, items: [text] };
      }
      last = 'item';
      continue;
    }

    const row = splitRow(line) ?? priceRow(line);
    if (row) {
      const cur = current as BodyBlock | null;
      if (cur?.type === 'rows') cur.rows.push(row);
      else {
        flush();
        current = { type: 'rows', rows: [row] };
      }
      last = 'row';
      continue;
    }

    // 표시 없는 일반 줄
    const cur = current as BodyBlock | null;
    if (last === 'item' && cur?.type === 'list') {
      cur.items[cur.items.length - 1] += `\n${line}`;
      continue; // last 는 'item' 유지 — 여러 줄 연속 가능
    }
    if (cur?.type === 'paragraph') cur.lines.push(line);
    else {
      flush();
      current = { type: 'paragraph', lines: [line] };
    }
    last = 'plain';
  }
  flush();
  return out;
}

/** 짧은 줄 여러 개로 된 문단(교육 일정 등) → 목록. 목록 섹션이면 모든 문단을 목록으로. */
function listify(blocks: BodyBlock[], forceList: boolean): BodyBlock[] {
  return blocks.map((b) => {
    if (b.type !== 'paragraph') return b;
    const shortLines =
      b.lines.length >= 2 &&
      b.lines.every((l) => l.length <= SHORT_LINE_MAX && !SENTENCE_END_RE.test(l) && !KOREAN_END_RE.test(l));
    if (forceList || shortLines) return { type: 'list', ordered: false, items: [...b.lines] };
    return b;
  });
}

export function parseTourBody(body: string): ParsedBody {
  const lines = (body ?? '').split(/\r?\n/);
  const introLines: string[] = [];
  const raw: { title: string; lines: string[] }[] = [];
  for (const line of lines) {
    const title = TITLE_RE.exec(line.trim());
    if (title) {
      raw.push({ title: title[1].trim(), lines: [] });
      continue;
    }
    (raw.length ? raw[raw.length - 1].lines : introLines).push(line);
  }
  return {
    intro: listify(parseLines(introLines), false),
    sections: raw
      .map((s) => ({ title: s.title, blocks: listify(parseLines(s.lines), LIST_SECTION_RE.test(s.title)) }))
      .filter((s) => s.blocks.length > 0 || s.title)
  };
}

/**
 * 진행 순서 칸(구조화 steps)을 채운 투어용 — 본문의 "A -> B" 흐름 그림을 빼서 같은 그림이 두 번 나오지 않게 한다.
 * 흐름 그림만 있던 섹션은 제목만 남지 않도록 통째로 뺀다. 다른 글은 그대로 둔다.
 */
export function withoutFlowBlocks(parsed: ParsedBody): ParsedBody {
  const keep = (blocks: BodyBlock[]) => blocks.filter((b) => b.type !== 'steps');
  return {
    intro: keep(parsed.intro),
    sections: parsed.sections
      .map((s) => ({ ...s, blocks: keep(s.blocks) }))
      .filter((s, i) => s.blocks.length > 0 || parsed.sections[i].blocks.length === 0)
  };
}
