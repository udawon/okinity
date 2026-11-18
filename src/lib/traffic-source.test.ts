import { describe, expect, it } from 'vitest';
import {
  classifySource,
  isAiSource,
  normalizeSourceId,
  sourceLabel,
  sourceSummary,
  summarizeInquirySources
} from './traffic-source';

const SITE = 'okinity.com';

describe('classifySource — 유입처 분류', () => {
  it('AI 답변의 링크(utm_source)가 referrer 보다 우선', () => {
    expect(classifySource({ url: 'https://okinity.com/ko?utm_source=chatgpt.com', referrer: '', host: SITE })).toBe('chatgpt');
    expect(classifySource({ url: 'https://okinity.com/ko?utm_source=perplexity', host: SITE })).toBe('perplexity');
  });

  it('referrer 사이트 이름으로', () => {
    const r = (referrer: string) => classifySource({ referrer, url: 'https://okinity.com/ko', host: SITE });
    expect(r('https://chatgpt.com/')).toBe('chatgpt');
    expect(r('https://claude.ai/chat/abc')).toBe('claude');
    expect(r('https://www.perplexity.ai/search?q=x')).toBe('perplexity');
    expect(r('https://gemini.google.com/app')).toBe('gemini');
    expect(r('https://www.google.co.kr/')).toBe('google');
    expect(r('https://m.search.naver.com/search.naver?query=x')).toBe('naver');
    expect(r('https://blog.naver.com/someone/1')).toBe('naver');
    expect(r('https://l.instagram.com/')).toBe('instagram');
    expect(r('https://pf.kakao.com/_GLkxlX')).toBe('kakao');
    expect(r('https://www.youtube.com/')).toBe('youtube');
  });

  it('우리 사이트에서 온 이동은 내부, 모르는 사이트는 사이트 이름만(주소 전체 저장 안 함)', () => {
    expect(classifySource({ referrer: 'https://okinity.com/ko/about', host: SITE })).toBe('internal');
    expect(classifySource({ referrer: 'https://www.okinity.com/ko', host: SITE })).toBe('internal');
    expect(classifySource({ referrer: 'https://travel.example.co.kr/post/123?x=1', host: SITE })).toBe(
      'other:travel.example.co.kr'
    );
  });

  it('referrer 가 없으면 앱 안 브라우저(UA)로, 그것도 아니면 직접 방문', () => {
    expect(classifySource({ referrer: '', ua: 'Mozilla/5.0 ... KAKAOTALK 10.4.5', host: SITE })).toBe('kakao');
    expect(classifySource({ referrer: '', ua: 'Mozilla/5.0 ... Instagram 300.0', host: SITE })).toBe('instagram');
    expect(classifySource({ referrer: '', ua: 'Mozilla/5.0 (iPhone) Safari/604.1', host: SITE })).toBe('direct');
    expect(classifySource({ referrer: 'not a url', host: SITE })).toBe('direct');
  });
});

describe('isAiSource · sourceLabel', () => {
  it('AI 유입 구분', () => {
    expect(['chatgpt', 'claude', 'perplexity', 'gemini', 'copilot'].every(isAiSource)).toBe(true);
    expect(isAiSource('google')).toBe(false);
    expect(isAiSource('other:chatgpt.com.evil')).toBe(false);
  });
  it('어드민 표시 이름', () => {
    expect(sourceLabel('chatgpt')).toBe('ChatGPT');
    expect(sourceLabel('naver')).toBe('네이버');
    expect(sourceLabel('direct')).toBe('직접 방문');
    expect(sourceLabel('other:travel.example.co.kr')).toBe('travel.example.co.kr');
  });
});

describe('normalizeSourceId — 브라우저가 보낸 값 검증', () => {
  it('아는 값·other:사이트이름만 통과', () => {
    expect(normalizeSourceId('chatgpt')).toBe('chatgpt');
    expect(normalizeSourceId('other:travel.example.co.kr')).toBe('other:travel.example.co.kr');
    expect(normalizeSourceId('other:<script>')).toBeNull();
    expect(normalizeSourceId('hacker')).toBeNull();
    expect(normalizeSourceId(3)).toBeNull();
    expect(normalizeSourceId('other:' + 'a'.repeat(200))).toBeNull();
  });
});

describe('sourceSummary — 예약 문의의 유입 표시', () => {
  it('처음·마지막이 다르면 둘 다, 같으면 하나, 없으면 빈 값', () => {
    expect(sourceSummary({ sourceFirst: 'chatgpt', sourceLast: 'naver' })).toBe('처음 ChatGPT · 마지막 네이버');
    expect(sourceSummary({ sourceFirst: 'instagram', sourceLast: 'instagram' })).toBe('인스타그램');
    expect(sourceSummary({ sourceLast: 'naver' })).toBe('네이버');
    expect(sourceSummary({})).toBe('');
  });
});

describe('summarizeInquirySources — 예약 문의 유입', () => {
  it('처음 유입처별 수, AI 가 처음이나 마지막인 문의', () => {
    const s = summarizeInquirySources([
      { id: 'a', sourceFirst: 'chatgpt', sourceLast: 'naver' },
      { id: 'b', sourceFirst: 'naver', sourceLast: 'claude' },
      { id: 'c', sourceFirst: 'naver', sourceLast: 'naver' },
      { id: 'd' }
    ]);
    expect(s.total).toBe(4);
    expect(s.tracked).toBe(3);
    expect(s.ai.map((i) => i.id)).toEqual(['a', 'b']);
    expect(s.byFirst).toEqual([
      { source: 'naver', count: 2 },
      { source: 'chatgpt', count: 1 }
    ]);
  });
});
