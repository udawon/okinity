import { describe, expect, it } from 'vitest';
import {
  activeOptions,
  clampPeople,
  findOption,
  localizeOptions,
  newOptionKey,
  optionMinPeople,
  optionPeopleRange,
  optionPeopleRule,
  parseTourOptions,
  pricingWithOption,
  type TourOption
} from './tour-options';
import { estimateTotal, startingPrice, type TourPricing } from './tour';

const opt = (patch: Partial<TourOption> & { key: string }): TourOption => ({
  name: '',
  description: '',
  pricePerPerson: null,
  minPeople: null,
  maxPeople: null,
  ...patch
});

const general = opt({ key: 'o1', name: '일반', pricePerPerson: 6000, minPeople: 2 });
const privateOpt = opt({ key: 'o2', name: '프라이빗', pricePerPerson: 9000, minPeople: 1 });

describe('parseTourOptions', () => {
  it('저장값이 없거나 잘못되면 빈 목록', () => {
    expect(parseTourOptions(undefined)).toEqual([]);
    expect(parseTourOptions('x')).toEqual([]);
  });

  it('잘못된 숫자는 그 칸만 비운다', () => {
    const [o] = parseTourOptions([{ key: 'o1', name: '일반', pricePerPerson: '6000', minPeople: 0 }]);
    expect(o).toEqual(opt({ key: 'o1', name: '일반' }));
  });
});

describe('activeOptions', () => {
  it('이름 있는 옵션이 2개 이상일 때만 고를 수 있다', () => {
    expect(activeOptions([general, privateOpt])).toEqual([general, privateOpt]);
    expect(activeOptions([general, opt({ key: 'o3', name: '  ' })])).toEqual([]);
    expect(activeOptions([general])).toEqual([]);
  });
});

describe('localizeOptions', () => {
  it('구조·요금은 한국어 저장본, 이름·설명은 같은 key 의 번역(비면 한국어)', () => {
    const en = [opt({ key: 'o2', name: 'Private', description: 'Just your group' }), opt({ key: 'o1', name: '' })];
    expect(localizeOptions([general, privateOpt], en)).toEqual([
      general,
      { ...privateOpt, name: 'Private', description: 'Just your group' }
    ]);
  });

  it('번역본이 없으면 한국어 그대로', () => {
    expect(localizeOptions([general], undefined)).toEqual([general]);
  });
});

describe('옵션 요금 계산', () => {
  const tourPricing: TourPricing = { priceMode: 'perPerson', pricePerPerson: 6000, priceSolo: 9000, priceTiers: [] };

  it('옵션에 1인 요금이 있으면 그 요금 × 인원(1인 단독 요금은 쓰지 않음)', () => {
    const p = pricingWithOption(tourPricing, privateOpt);
    expect(estimateTotal(p, 1)).toBe(9000);
    expect(estimateTotal(p, 3)).toBe(27000);
    expect(startingPrice(p)).toBe(9000);
    expect(estimateTotal(pricingWithOption(tourPricing, general), 2)).toBe(12000);
  });

  it('옵션 요금이 비었거나 옵션이 없으면 투어 요금 그대로', () => {
    expect(pricingWithOption(tourPricing, opt({ key: 'o3', name: '기타' }))).toBe(tourPricing);
    expect(pricingWithOption(tourPricing, undefined)).toBe(tourPricing);
  });
});

describe('인원 하한', () => {
  it('최소 인원이 없으면 1명', () => {
    expect(optionMinPeople(general)).toBe(2);
    expect(optionMinPeople(opt({ key: 'o3' }))).toBe(1);
    expect(optionMinPeople(undefined)).toBe(1);
  });

  it('인원은 최소~최대 사이로 맞춘다', () => {
    expect(clampPeople(1, 2, 20)).toBe(2);
    expect(clampPeople(5, 1, 3)).toBe(3);
    expect(clampPeople(4, 2, 20)).toBe(4);
  });
});

describe('옵션 인원 범위 — 최대 인원(예: 1인 단독투어는 1명만)', () => {
  const solo = opt({ key: 'o3', name: '1인 단독투어', pricePerPerson: 9000, minPeople: 1, maxPeople: 1 });
  const priv = opt({ key: 'o4', name: '프라이빗', minPeople: 2, maxPeople: 8 });

  it('저장된 최대 인원을 읽고, 없거나 잘못되면 비운다', () => {
    expect(parseTourOptions([{ key: 'o3', name: '1인', maxPeople: 1 }])[0].maxPeople).toBe(1);
    expect(parseTourOptions([{ key: 'o3', name: '1인', maxPeople: 0 }])[0].maxPeople).toBeNull();
    expect(parseTourOptions([{ key: 'o3', name: '1인' }])[0].maxPeople).toBeNull();
  });

  it('최소~최대 범위 — 최대가 없으면 기본 상한, 최소보다 작게 저장됐으면 최소로', () => {
    expect(optionPeopleRange(solo)).toEqual({ min: 1, max: 1 });
    expect(optionPeopleRange(priv)).toEqual({ min: 2, max: 8 });
    expect(optionPeopleRange(general, 20)).toEqual({ min: 2, max: 20 });
    expect(optionPeopleRange(opt({ key: 'x', minPeople: 4, maxPeople: 2 }))).toEqual({ min: 4, max: 4 });
    expect(optionPeopleRange(undefined, 20)).toEqual({ min: 1, max: 20 });
  });

  it('손님에게 보여줄 인원 규칙 — N명부터 / N~M명 / N명만', () => {
    expect(optionPeopleRule(general)).toEqual({ kind: 'from', n: 2 });
    expect(optionPeopleRule(priv)).toEqual({ kind: 'range', min: 2, max: 8 });
    expect(optionPeopleRule(solo)).toEqual({ kind: 'only', n: 1 });
    expect(optionPeopleRule(privateOpt)).toEqual({ kind: 'from', n: 1 });
  });
});

describe('findOption', () => {
  it('목록에 있는 key 만 받는다', () => {
    expect(findOption([general, privateOpt], 'o2')).toBe(privateOpt);
    expect(findOption([general, privateOpt], 'zzz')).toBeUndefined();
    expect(findOption([general, privateOpt], null)).toBeUndefined();
  });
});

describe('newOptionKey', () => {
  it('기존 key 와 겹치지 않는 새 key', () => {
    const k = newOptionKey(['o1', 'o2'], 1_000);
    expect(k).toMatch(/^o[0-9a-z]+$/);
    expect(['o1', 'o2']).not.toContain(k);
    expect(newOptionKey([k], 1_000)).not.toBe(k);
  });
});
