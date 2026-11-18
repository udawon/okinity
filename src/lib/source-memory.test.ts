import { describe, expect, it } from 'vitest';
import { FIRST_TOUCH_DAYS, nextSourceMemory } from './source-memory';

const DAY = 86_400_000;

describe('nextSourceMemory — 처음(30일)·마지막 유입처', () => {
  it('처음 방문이면 처음=마지막=지금 유입처', () => {
    expect(nextSourceMemory(null, 'chatgpt', 1000)).toEqual({ first: { s: 'chatgpt', t: 1000 }, last: 'chatgpt' });
  });
  it('30일 안에 다른 곳으로 다시 오면 처음은 유지, 마지막만 바뀜', () => {
    const prev = { first: { s: 'chatgpt', t: 0 }, last: 'chatgpt' };
    expect(nextSourceMemory(prev, 'naver', 3 * DAY)).toEqual({ first: { s: 'chatgpt', t: 0 }, last: 'naver' });
  });
  it('사이트 안 이동(internal)은 아무것도 바꾸지 않는다', () => {
    const prev = { first: { s: 'chatgpt', t: 0 }, last: 'naver' };
    expect(nextSourceMemory(prev, 'internal', DAY)).toEqual(prev);
    expect(nextSourceMemory(null, 'internal', DAY)).toEqual({ first: { s: 'direct', t: DAY }, last: 'direct' });
  });
  it('직접 방문(즐겨찾기·주소 입력)은 기억이 있으면 덮어쓰지 않는다 — 마지막 비직접 유입', () => {
    const prev = { first: { s: 'chatgpt', t: 0 }, last: 'naver' };
    expect(nextSourceMemory(prev, 'direct', DAY)).toEqual(prev);
    expect(nextSourceMemory(null, 'direct', DAY)).toEqual({ first: { s: 'direct', t: DAY }, last: 'direct' });
    const directOnly = { first: { s: 'direct', t: 0 }, last: 'direct' };
    expect(nextSourceMemory(directOnly, 'chatgpt', DAY)).toEqual({ first: { s: 'direct', t: 0 }, last: 'chatgpt' });
  });
  it('30일이 지나면 처음 유입처를 새로', () => {
    const prev = { first: { s: 'chatgpt', t: 0 }, last: 'chatgpt' };
    const later = (FIRST_TOUCH_DAYS + 1) * DAY;
    expect(nextSourceMemory(prev, 'instagram', later)).toEqual({ first: { s: 'instagram', t: later }, last: 'instagram' });
  });
});
