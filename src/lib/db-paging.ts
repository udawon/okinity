/**
 * 끝까지 읽기 — Supabase(PostgREST)는 한 번에 최대 1,000행만 돌려준다(.limit 으로도 못 넘김).
 * range(from, to) 를 페이지 단위로 넘기며, 덜 찬 페이지가 오거나 상한(maxRows)에 닿으면 멈춘다. 범용 순수 모듈.
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
  maxRows = 100_000
): Promise<{ data: T[]; error: unknown }> {
  const data: T[] = [];
  while (data.length < maxRows) {
    const from = data.length;
    const { data: rows, error } = await page(from, Math.min(from + pageSize, maxRows) - 1);
    if (error) return { data, error };
    data.push(...(rows ?? []));
    if (!rows || rows.length < pageSize) break;
  }
  return { data, error: null };
}
