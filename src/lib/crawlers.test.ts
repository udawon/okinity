import { describe, expect, it } from 'vitest';
import { crawlerOf, crawlerPath, summarizeCrawlers } from './crawlers';

describe('crawlerOf — 크롤러 이름(AI·검색)', () => {
  it('AI 크롤러는 용도까지 구분(학습 vs 검색 vs 사용자 요청)', () => {
    expect(crawlerOf('Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)')).toEqual({ name: 'GPTBot', kind: 'ai' });
    expect(crawlerOf('Mozilla/5.0 (compatible; OAI-SearchBot/1.0)')).toEqual({ name: 'OAI-SearchBot', kind: 'ai' });
    expect(crawlerOf('Mozilla/5.0 AppleWebKit/537.36 (compatible; ChatGPT-User/1.0)')).toEqual({ name: 'ChatGPT-User', kind: 'ai' });
    expect(crawlerOf('Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)')).toEqual({ name: 'ClaudeBot', kind: 'ai' });
    expect(crawlerOf('Mozilla/5.0 (compatible; PerplexityBot/1.0)')).toEqual({ name: 'PerplexityBot', kind: 'ai' });
  });
  it('검색엔진', () => {
    expect(crawlerOf('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toEqual({ name: 'Googlebot', kind: 'search' });
    expect(crawlerOf('Mozilla/5.0 (compatible; Yeti/1.1; +http://naver.me/spd)')).toEqual({ name: 'Yeti(네이버)', kind: 'search' });
    expect(crawlerOf('Mozilla/5.0 (compatible; bingbot/2.0)')).toEqual({ name: 'Bingbot', kind: 'search' });
  });
  it('사람·모르는 봇은 기록하지 않음', () => {
    expect(crawlerOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1')).toBeNull();
    expect(crawlerOf('curl/8.0')).toBeNull();
    expect(crawlerOf('')).toBeNull();
  });
});

describe('crawlerPath — 저장할 주소(쿼리 제외·길이 제한)', () => {
  it('경로만', () => {
    expect(crawlerPath('/ko/tours/blue-cave-dive')).toBe('/ko/tours/blue-cave-dive');
    expect(crawlerPath('/ko/blog/' + 'x'.repeat(300))).toHaveLength(200);
  });
});

describe('summarizeCrawlers — 봇별 방문 요약', () => {
  it('AI 먼저, 같은 종류는 페이지 수 많은 순. 다녀간 날·마지막 날·많이 본 주소', () => {
    const s = summarizeCrawlers([
      { day: '2026-11-17', bot: 'Googlebot', path: '/ko' },
      { day: '2026-11-17', bot: 'Googlebot', path: '/ko/about' },
      { day: '2026-11-18', bot: 'Googlebot', path: '/ko' },
      { day: '2026-11-16', bot: 'GPTBot', path: '/ko/blog/a' },
      { day: '2026-11-18', bot: 'GPTBot', path: '/ko/blog/a' },
      { day: '2026-11-18', bot: 'GPTBot', path: '/en' }
    ]);
    expect(s.map((b) => b.bot)).toEqual(['GPTBot', 'Googlebot']);
    expect(s[0]).toEqual({
      bot: 'GPTBot',
      kind: 'ai',
      days: 2,
      hits: 3,
      lastDay: '2026-11-18',
      topPaths: ['/ko/blog/a', '/en']
    });
    expect(s[1].kind).toBe('search');
  });
});
