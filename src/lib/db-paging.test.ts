import { describe, expect, it } from 'vitest';
import { fetchAllPages } from './db-paging';

describe('fetchAllPages — 1,000행 제한을 넘어 끝까지 읽기', () => {
  it('꽉 찬 페이지면 다음 페이지를, 덜 찬 페이지에서 멈춤', async () => {
    const all = Array.from({ length: 2500 }, (_, i) => i);
    const ranges: [number, number][] = [];
    const r = await fetchAllPages(async (from, to) => {
      ranges.push([from, to]);
      return { data: all.slice(from, to + 1), error: null };
    }, 1000);
    expect(r).toEqual({ data: all, error: null });
    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999]
    ]);
  });
  it('오류면 즉시 멈추고 오류를 돌려줌', async () => {
    const r = await fetchAllPages(async () => ({ data: null, error: { code: '42P01' } }), 1000);
    expect(r.error).toEqual({ code: '42P01' });
  });
  it('상한(maxRows)에서 멈춤', async () => {
    let calls = 0;
    const r = await fetchAllPages(async (from, to) => {
      calls++;
      return { data: Array.from({ length: to - from + 1 }, () => 1), error: null };
    }, 1000, 3000);
    expect(r.data).toHaveLength(3000);
    expect(calls).toBe(3);
  });
});
