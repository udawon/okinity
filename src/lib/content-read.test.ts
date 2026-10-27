import { describe, expect, it, vi } from 'vitest';
import { normalizeContentKeys, orEmpty, rowsToContentMap } from './content-read';

describe('normalizeContentKeys — 캐시 칸을 결정적으로', () => {
  it('중복 제거·정렬 — 순서만 다른 같은 요청은 같은 캐시를 쓴다', () => {
    expect(normalizeContentKeys(['tour:b', 'about', 'tour:b'])).toEqual(['about', 'tour:b']);
  });

  it('생략·빈 배열은 전체 조회(null) — 기존 동작', () => {
    expect(normalizeContentKeys()).toBeNull();
    expect(normalizeContentKeys([])).toBeNull();
  });
});

describe('rowsToContentMap — 저장소 응답 해석', () => {
  it('행을 key→value 맵으로, 빈 value 는 {}', () => {
    expect(
      rowsToContentMap({ data: [{ key: 'about', value: { a: 1 } }, { key: 'blog', value: null }], error: null })
    ).toEqual({ about: { a: 1 }, blog: {} });
  });

  it('행이 없으면 빈 맵(정상)', () => {
    expect(rowsToContentMap({ data: [], error: null })).toEqual({});
  });

  it('오류면 throw — 장애를 빈 값으로 캐시하면 "정상 데이터 없음"으로 굳는다', () => {
    expect(() =>
      rowsToContentMap({ data: null, error: { message: 'Service for this project is restricted' } })
    ).toThrow(/restricted/);
  });

  it('오류 없이 data 도 없으면 throw — 비정상 응답을 빈 값으로 확정하지 않는다', () => {
    expect(() => rowsToContentMap({ data: null, error: null })).toThrow();
  });
});

describe('orEmpty — 마지막 방어선', () => {
  it('성공하면 그 값', async () => {
    await expect(orEmpty<Record<string, number>>(async () => ({ a: 1 }), {}, 't')).resolves.toEqual({ a: 1 });
  });

  it('실패하면 빈 값 + 오류 기록(페이지가 500으로 죽지 않게)', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      orEmpty(async () => {
        throw new Error('402');
      }, {}, 'site_content')
    ).resolves.toEqual({});
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
