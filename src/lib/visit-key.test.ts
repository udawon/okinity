import { describe, expect, it } from 'vitest';
import { clientIp, isBot, jstDateKey, visitorHash } from './visit-key';

describe('jstDateKey', () => {
  it('오키나와(JST) 기준 날짜 — UTC 15시가 넘으면 다음 날', () => {
    expect(jstDateKey(new Date('2026-09-28T14:59:00Z'))).toBe('2026-09-28');
    expect(jstDateKey(new Date('2026-09-28T15:00:00Z'))).toBe('2026-09-29');
  });
});

describe('isBot', () => {
  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0)',
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (Linux) HeadlessChrome/120.0 Safari/537.36',
    'curl/8.4.0',
    'python-requests/2.31',
    'Mozilla/5.0 (Windows NT 10.0) Chrome-Lighthouse',
    ''
  ])('봇: %s', (ua) => {
    expect(isBot(ua)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 KAKAOTALK 10.8.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
  ])('사람: %s', (ua) => {
    expect(isBot(ua)).toBe(false);
  });
});

describe('clientIp', () => {
  it('x-forwarded-for 의 첫 주소, 없으면 x-real-ip', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
    expect(clientIp(new Headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8');
    expect(clientIp(new Headers())).toBe('');
  });
});

describe('visitorHash', () => {
  it('같은 날·같은 사람은 같은 값, 날짜가 바뀌면 다른 값(날짜 간 추적 불가)', async () => {
    const a = await visitorHash('secret', '2026-09-28', '1.2.3.4', 'UA');
    const b = await visitorHash('secret', '2026-09-28', '1.2.3.4', 'UA');
    const c = await visitorHash('secret', '2026-09-29', '1.2.3.4', 'UA');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });

  it('IP 원문이 결과에 남지 않는다', async () => {
    const h = await visitorHash('secret', '2026-09-28', '123.45.67.89', 'UA');
    expect(h).not.toContain('123');
  });
});
