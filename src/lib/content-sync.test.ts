import { describe, expect, it } from 'vitest';
import {
  buildLocalDoc,
  finalizeSync,
  manualEditSrc,
  planSync,
  staleCount,
  syncMessage,
  textEntries,
  SYNC_PATHS
} from './content-sync';

const ko = {
  summary: '푸른동굴 스노클링',
  price: '1인 6,000엔',
  images: ['a.jpg', 'b.jpg'],
  published: true,
  steps: [
    { name: '집합', time: '' },
    { name: '보트 이동', time: '약 7분' }
  ],
  options: [
    { key: 'o1', name: '일반 투어', description: '다른 팀과 동행', pricePerPerson: 6000 },
    { key: 'o2', name: '1인 단독투어', description: '', pricePerPerson: 9000 }
  ],
  body: ''
};

describe('textEntries — 번역 대상 글 뽑기', () => {
  it('지정한 경로의 글만, 목록은 순번 경로로', () => {
    expect(textEntries(ko, SYNC_PATHS.tour)).toEqual({
      summary: '푸른동굴 스노클링',
      price: '1인 6,000엔',
      body: '',
      'steps.0.name': '집합',
      'steps.0.time': '',
      'steps.1.name': '보트 이동',
      'steps.1.time': '약 7분',
      'options.0.name': '일반 투어',
      'options.0.description': '다른 팀과 동행',
      'options.1.name': '1인 단독투어',
      'options.1.description': ''
    });
  });

  it('문서가 없거나 칸이 글이 아니면 건너뛴다', () => {
    expect(textEntries(null, SYNC_PATHS.tour)).toEqual({});
    expect(textEntries({ summary: 3, steps: 'x' }, SYNC_PATHS.tour)).toEqual({});
  });
});

describe('planSync — 무엇을 재사용하고 무엇을 번역할지', () => {
  const koTexts = textEntries(ko, SYNC_PATHS.tour);

  it('번역본이 처음이면 한글이 있는 글만 번역, 빈 글·한글 없는 글은 그대로', () => {
    const plan = planSync(koTexts, {}, {});
    expect(Object.keys(plan.pending).sort()).toEqual(
      ['summary', 'price', 'steps.0.name', 'steps.1.name', 'steps.1.time', 'options.0.name', 'options.0.description', 'options.1.name'].sort()
    );
    expect(plan.ready).toEqual({ body: '', 'steps.0.time': '', 'options.1.description': '' });
  });

  it('원문이 같으면 기존 번역 재사용 — 순서가 바뀌어도(원문 기준)', () => {
    const prevLocal = { 'steps.0.name': 'Boat transfer', 'steps.1.name': 'Meet up', summary: 'Blue Cave Snorkeling' };
    const prevSrc = { 'steps.0.name': '보트 이동', 'steps.1.name': '집합', summary: '푸른동굴 스노클링' };
    const plan = planSync(koTexts, prevLocal, prevSrc);
    expect(plan.ready['steps.0.name']).toBe('Meet up');
    expect(plan.ready['steps.1.name']).toBe('Boat transfer');
    expect(plan.ready.summary).toBe('Blue Cave Snorkeling');
    expect(plan.pending.price).toBe('1인 6,000엔');
  });

  it('미리 정해 둔 번역(glossary)은 번역하지 않고 쓴다', () => {
    const plan = planSync({ 'refund.title': '환불 규정' }, {}, {}, { '환불 규정': 'Refund Policy' });
    expect(plan.ready).toEqual({ 'refund.title': 'Refund Policy' });
    expect(plan.pending).toEqual({});
  });

  it('한국어가 바뀐 칸은 다시 번역 대상', () => {
    const plan = planSync({ price: '1인 8,000엔' }, { price: '¥6,000 per person' }, { price: '1인 6,000엔' });
    expect(plan.pending).toEqual({ price: '1인 8,000엔' });
    expect(plan.ready).toEqual({});
  });
});

describe('buildLocalDoc — 번역본 조립', () => {
  it('한국어 문서 구조(사진·숫자·공개·key)를 그대로 쓰고 글만 바꾼다', () => {
    const doc = buildLocalDoc(ko, { summary: 'Blue Cave', 'options.1.name': 'Solo tour' });
    expect(doc).toEqual({
      ...ko,
      summary: 'Blue Cave',
      options: [ko.options[0], { ...ko.options[1], name: 'Solo tour' }]
    });
    expect(ko.summary).toBe('푸른동굴 스노클링'); // 원본 불변
  });
});

describe('staleCount — 번역이 한국어보다 오래된 칸 수', () => {
  it('원문 지도와 다른(또는 없는) 한글 글만 센다', () => {
    const koTexts = { summary: '요약', price: '1인 6,000엔', 'steps.0.time': '09:00', body: '' };
    expect(staleCount(koTexts, { summary: '요약', price: '1인 5,000엔' })).toBe(1);
    expect(staleCount(koTexts, {})).toBe(2);
    expect(staleCount(koTexts, { summary: '요약', price: '1인 6,000엔' })).toBe(0);
  });
});

describe('manualEditSrc — EN/JA 탭에서 사람이 고친 번역 기록', () => {
  it('바뀐 칸은 지금 한국어 원문으로 기록, 나머지 기록은 유지', () => {
    const src = manualEditSrc(
      { price: '1인 8,000엔', summary: '요약 새것' },
      { price: '¥6,000', summary: 'Old summary' },
      { price: '¥8,000 per person', summary: 'Old summary' },
      { price: '1인 6,000엔', summary: '요약 옛것' }
    );
    expect(src).toEqual({ price: '1인 8,000엔', summary: '요약 옛것' });
  });
});

describe('finalizeSync — 번역 결과 반영', () => {
  const koTexts = { summary: '요약', price: '1인 8,000엔', body: '새 본문', 'steps.0.time': '09:00' };
  const plan = { ready: { summary: 'Summary', 'steps.0.time': '09:00' }, pending: { price: '1인 8,000엔', body: '새 본문' } };

  it('번역 성공 칸은 번역으로, 원문 지도는 지금 한국어로', () => {
    const r = finalizeSync(koTexts, plan, { price: '¥8,000 per person', body: 'New body' }, {}, {});
    expect(r.texts).toEqual({ summary: 'Summary', 'steps.0.time': '09:00', price: '¥8,000 per person', body: 'New body' });
    expect(r.src).toEqual(koTexts);
    expect(r.translated).toBe(2);
    expect(r.left).toBe(0);
  });

  it('번역 실패(키 없음 등) — 기존 번역은 유지하고 새 칸은 한국어, 원문 지도는 그대로(번역 필요로 남음)', () => {
    const r = finalizeSync(koTexts, plan, null, { price: '¥6,000 per person' }, { price: '1인 6,000엔' });
    expect(r.texts.price).toBe('¥6,000 per person');
    expect(r.texts.body).toBe('새 본문');
    expect(r.src).toEqual({ summary: '요약', 'steps.0.time': '09:00', price: '1인 6,000엔' });
    expect(r.translated).toBe(0);
    expect(r.left).toBe(2);
  });
});

describe('syncMessage — 저장 메시지의 번역 결과', () => {
  const langs = (en: [number, number], ja: [number, number]) => [
    { locale: 'en' as const, translated: en[0], left: en[1] },
    { locale: 'ja' as const, translated: ja[0], left: ja[1] }
  ];
  it('번역한 칸 수를 언어별로', () => {
    expect(syncMessage({ enabled: true, langs: langs([3, 0], [3, 0]) })).toEqual({ text: '자동 번역: 영어 3칸 · 일본어 3칸', warn: false });
  });
  it('바뀐 글이 없으면 맞췄다고만', () => {
    expect(syncMessage({ enabled: true, langs: langs([0, 0], [0, 0]) }).warn).toBe(false);
  });
  it('실패·꺼짐·오류는 경고로 남긴다', () => {
    expect(syncMessage({ enabled: true, langs: langs([3, 0], [0, 3]) })).toMatchObject({ warn: true });
    expect(syncMessage({ enabled: true, langs: langs([3, 0], [0, 3]) }).text).toMatch(/일본어 3칸/);
    expect(syncMessage({ enabled: false, langs: [] }).warn).toBe(true);
    expect(syncMessage({ enabled: true, langs: [], error: 'x' }).warn).toBe(true);
  });
  it('동기화하지 않은 저장(EN/JA 탭)은 빈 문구', () => {
    expect(syncMessage(undefined)).toEqual({ text: '', warn: false });
  });
});
