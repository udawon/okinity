/**
 * 투어별 가능 시간대 모델·파싱 유틸 — 서버/클라 공용(순수, fs 의존 없음).
 * 어드민이 투어(slug)마다 입력한 시간대 텍스트가 예약 폼의 선택지가 된다.
 * 시간대가 없는 투어는 예약 폼에서 '개별 문의' 안내로 대체된다.
 */

/** slug → 시간대 텍스트 배열(입력 원문이 그대로 선택지로 노출된다). */
export type TourTimes = Record<string, string[]>;

/**
 * 저장값 { times: { [slug]: string[] } }을 관대하게 파싱.
 * 문자열 배열만 채택하고 trim 후 빈 값·중복은 제거 — 형식이 어긋난 항목은 조용히 건너뛴다.
 * (중복 제거는 예약 폼 select의 option key 충돌·중복 노출 방지를 겸한다.)
 */
export function parseTourTimes(value: unknown): TourTimes {
  const out: TourTimes = {};
  if (!value || typeof value !== 'object') return out;
  const times = (value as { times?: unknown }).times;
  if (!times || typeof times !== 'object') return out;
  for (const [slug, raw] of Object.entries(times as Record<string, unknown>)) {
    if (!Array.isArray(raw)) continue;
    const list = Array.from(
      new Set(
        raw
          .filter((v): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean)
      )
    );
    if (list.length) out[slug] = list;
  }
  return out;
}
