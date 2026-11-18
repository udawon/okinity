import { describe, expect, it } from 'vitest';
import { insertWithSchemaFallback, isMissingSchemaError } from './db-errors';

describe('isMissingSchemaError — SQL 실행 전(칸·표 없음) 판별', () => {
  it('없는 칸·없는 표', () => {
    expect(isMissingSchemaError({ code: 'PGRST204', message: "Could not find the 'source_first' column" })).toBe(true);
    expect(isMissingSchemaError({ code: '42703', message: 'column "source" does not exist' })).toBe(true);
    expect(isMissingSchemaError({ code: '42P01', message: 'relation "geo_checks" does not exist' })).toBe(true);
    expect(isMissingSchemaError({ code: 'PGRST205', message: "Could not find the table 'public.crawler_visits'" })).toBe(true);
  });
  it('그 외 오류는 아님(재시도로 숨기지 않는다)', () => {
    expect(isMissingSchemaError({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(isMissingSchemaError(null)).toBe(false);
    expect(isMissingSchemaError(new Error('network'))).toBe(false);
  });
});

describe('insertWithSchemaFallback — 새 칸이 없으면 그 칸 없이 다시 저장(예약 문의 유실 방지)', () => {
  it('칸 없음 오류면 선택 칸을 빼고 한 번 더', async () => {
    const calls: Record<string, unknown>[] = [];
    const insert = async (row: Record<string, unknown>) => {
      calls.push(row);
      return 'source_first' in row
        ? { data: null, error: { code: 'PGRST204', message: 'no column' } }
        : { data: { id: 'x' }, error: null };
    };
    const r = await insertWithSchemaFallback(insert, { id: 'x', name: 'a', source_first: 'chatgpt', source_last: 'naver' }, [
      'source_first',
      'source_last'
    ]);
    expect(r).toEqual({ data: { id: 'x' }, error: null });
    expect(calls).toEqual([
      { id: 'x', name: 'a', source_first: 'chatgpt', source_last: 'naver' },
      { id: 'x', name: 'a' }
    ]);
  });
  it('다른 오류는 다시 시도하지 않고 그대로', async () => {
    let n = 0;
    const insert = async () => {
      n++;
      return { data: null, error: { code: '23505', message: 'dup' } };
    };
    const r = await insertWithSchemaFallback(insert, { id: 'x', source_first: 'a' }, ['source_first']);
    expect(r.error).toEqual({ code: '23505', message: 'dup' });
    expect(n).toBe(1);
  });
  it('선택 칸이 없으면 처음부터 그 칸 없이 한 번만', async () => {
    let n = 0;
    const insert = async () => {
      n++;
      return { data: 1, error: { code: 'PGRST204', message: 'x' } };
    };
    await insertWithSchemaFallback(insert, { id: 'x' }, ['source_first']);
    expect(n).toBe(1);
  });
});
