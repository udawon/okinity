import { describe, expect, it } from 'vitest';
import { optionPeopleViolation } from './inquiry-rules';

const tour = {
  published: true,
  options: [
    { key: 'a', name: '일반 투어', description: '', pricePerPerson: 6000, minPeople: 2, maxPeople: null },
    { key: 'b', name: '1인 단독투어', description: '', pricePerPerson: 9000, minPeople: 1, maxPeople: 1 },
    { key: 'c', name: '프라이빗 투어', description: '', pricePerPerson: 8000, minPeople: 2, maxPeople: 8 }
  ]
};

describe('optionPeopleViolation — 예약 인원이 옵션 조건을 벗어났는지(서버 검증)', () => {
  const product = (opt: string) => `스노클링 · 푸른동굴 스노클링 · ${opt}`;

  it('범위 안이면 null', () => {
    expect(optionPeopleViolation(product('일반 투어'), 2, tour)).toBeNull();
    expect(optionPeopleViolation(product('프라이빗 투어'), 8, tour)).toBeNull();
    expect(optionPeopleViolation(product('1인 단독투어'), 1, tour)).toBeNull();
  });

  it('최소 미만·최대 초과면 허용 범위를 돌려준다', () => {
    expect(optionPeopleViolation(product('일반 투어'), 1, tour)).toEqual({ min: 2, max: 50 });
    expect(optionPeopleViolation(product('1인 단독투어'), 2, tour)).toEqual({ min: 1, max: 1 });
    expect(optionPeopleViolation(product('프라이빗 투어'), 9, tour)).toEqual({ min: 2, max: 8 });
  });

  it('판단할 수 없으면 막지 않는다(옵션 없음·모르는 옵션·인원 없음·비공개·낚시 클래스)', () => {
    expect(optionPeopleViolation('스노클링 · 푸른동굴 스노클링', 1, tour)).toBeNull();
    expect(optionPeopleViolation(product('없어진 옵션'), 1, tour)).toBeNull();
    expect(optionPeopleViolation(product('일반 투어'), undefined, tour)).toBeNull();
    expect(optionPeopleViolation(product('일반 투어'), 1, { ...tour, published: false })).toBeNull();
    expect(optionPeopleViolation('낚시 · 4시간 체험낚시 · 미들 클래스', 1, tour)).toBeNull();
    expect(optionPeopleViolation(undefined, 1, tour)).toBeNull();
  });
});
