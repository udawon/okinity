/**
 * site_content 읽기의 순수 로직 — 저장소 장애 때 "빈 값"이 정상 데이터로 굳지 않게 한다.
 * (server-only 인 site-content.ts 에서 분리해 단위 테스트 가능하게.)
 */

type Json = Record<string, unknown>;
type ContentRow = { key: string; value: unknown };

/** 조회 키 정규화 — 중복 제거·정렬해 같은 요청이 같은 캐시 칸을 쓰게 한다. 생략·빈 배열이면 전체(null). */
export function normalizeContentKeys(keys?: string[]): string[] | null {
  if (!keys || keys.length === 0) return null;
  return [...new Set(keys)].sort();
}

/**
 * 저장소 응답 → key-value 맵. 오류·비정상 응답이면 throw 한다.
 * 빈 맵을 돌려주면 캐시가 그걸 정상값으로 저장해, 장애가 끝날 때까지 기본 문구가 굳는다.
 */
export function rowsToContentMap(res: {
  data: ContentRow[] | null;
  error: { message: string } | null;
}): Record<string, Json> {
  if (res.error) throw new Error(`site_content 조회 실패: ${res.error.message}`);
  if (!res.data) throw new Error('site_content 조회 실패: 응답 없음');
  return Object.fromEntries(res.data.map((r) => [r.key, (r.value as Json) ?? {}]));
}

/** 읽기 실패 시 빈 값 — 캐시도 없고 저장소도 죽었을 때의 마지막 방어선(페이지는 기본값으로 뜬다). */
export async function orEmpty<T>(read: () => Promise<T>, empty: T, label: string): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`[${label}] 읽기 실패 — 빈 값으로 대체`, err);
    return empty;
  }
}
