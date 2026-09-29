import { describe, expect, it } from 'vitest';
import { buildTranslateRequest, parseTranslateResponse } from './translate';

describe('buildTranslateRequest — 번역 요청', () => {
  it('글마다 id 를 붙여 JSON 으로 보내고, 언어별 문체·금액 규칙을 알려준다', () => {
    const req = buildTranslateRequest({ summary: '푸른동굴 스노클링', price: '1인 6,000엔' }, 'ja', 'claude-sonnet-5');
    expect(req.model).toBe('claude-sonnet-5');
    expect(req.system).toMatch(/Japanese/);
    expect(req.system).toMatch(/円/);
    const payload = JSON.parse(req.messages[0].content);
    expect(payload).toEqual({ summary: '푸른동굴 스노클링', price: '1인 6,000엔' });
  });

  it('영어는 ¥ 표기 규칙', () => {
    expect(buildTranslateRequest({ a: '가' }, 'en', 'm').system).toMatch(/¥/);
  });
});

describe('parseTranslateResponse — 번역 결과 읽기', () => {
  it('JSON(코드 블록 포함)에서 요청한 id 의 글만 꺼낸다', () => {
    const text = '```json\n{"summary":"Blue Cave Snorkeling","price":"¥6,000 per person","extra":"x"}\n```';
    expect(parseTranslateResponse(text, ['summary', 'price'])).toEqual({
      summary: 'Blue Cave Snorkeling',
      price: '¥6,000 per person'
    });
  });

  it('id 가 빠졌거나 글이 아니면 null(재시도·실패 처리)', () => {
    expect(parseTranslateResponse('{"summary":"A"}', ['summary', 'price'])).toBeNull();
    expect(parseTranslateResponse('{"summary":3}', ['summary'])).toBeNull();
    expect(parseTranslateResponse('not json', ['summary'])).toBeNull();
  });
});

describe('retryWaitMs — 사용량 제한·일시 장애 때 기다렸다 재시도', () => {
  it('429·5xx·529 는 retry-after(초)만큼, 없으면 기본 대기', async () => {
    const { retryWaitMs } = await import('./translate');
    expect(retryWaitMs(429, '7', 40_000)).toBe(7_000);
    expect(retryWaitMs(529, null, 40_000)).toBe(3_000);
    expect(retryWaitMs(500, null, 40_000)).toBe(3_000);
  });
  it('남은 시간 안에 재시도할 수 없으면 null(포기), 그 밖의 오류도 null', async () => {
    const { retryWaitMs } = await import('./translate');
    expect(retryWaitMs(429, '30', 20_000)).toBeNull();
    expect(retryWaitMs(401, null, 40_000)).toBeNull();
    expect(retryWaitMs(400, null, 40_000)).toBeNull();
  });
});
