import { describe, expect, it } from 'vitest';
import {
  approxKrw,
  bookableOptions,
  isTourPublished,
  parsePeopleParam,
  reserveOptionsFor,
  splitLines,
  emptyTourDetail,
  estimateTotal,
  extractAgeRange,
  maxPeopleOf,
  parseTourDetail,
  startingPrice,
  type TourDetail
} from './tour';

const detail = (patch: Partial<TourDetail>): TourDetail => ({ ...emptyTourDetail(), ...patch });

describe('parseTourDetail — 하위 호환', () => {
  it('기존 저장값(새 필드 없음)은 그대로 읽히고 새 필드는 기본값', () => {
    const d = parseTourDetail({
      summary: '요약',
      price: '1인 13,000엔',
      body: '본문',
      published: true,
      images: ['a.jpg']
    });
    expect(d.summary).toBe('요약');
    expect(d.published).toBe(true);
    expect(d.priceMode).toBe('text');
    expect(d.pricePerPerson).toBeNull();
    expect(d.priceTiers).toEqual([]);
    expect(d.steps).toEqual([]);
    expect(d.notices).toEqual([]);
    expect(d.age).toBe('');
    expect(d.options).toEqual([]);
  });

  it('선택 옵션 — 형식이 틀린 항목만 빠지고 나머지 내용은 그대로', () => {
    const d = parseTourDetail({
      summary: '요약',
      options: [
        { key: 'o1', name: '일반', pricePerPerson: 6000, minPeople: 2 },
        { name: 'key 없음' },
        { key: 'o2', name: '프라이빗', pricePerPerson: 9000 }
      ]
    });
    expect(d.summary).toBe('요약');
    expect(d.options.map((o) => [o.key, o.name, o.pricePerPerson, o.minPeople])).toEqual([
      ['o1', '일반', 6000, 2],
      ['o2', '프라이빗', 9000, null]
    ]);
  });

  it('새 필드 하나가 잘못돼도 나머지 내용은 살아남는다', () => {
    const d = parseTourDetail({
      summary: '살아남아야 함',
      priceMode: '없는값',
      pricePerPerson: '문자열',
      priceTiers: 'not-array',
      steps: [{ nope: 1 }],
      notices: 3
    });
    expect(d.summary).toBe('살아남아야 함');
    expect(d.priceMode).toBe('text');
    expect(d.pricePerPerson).toBeNull();
    expect(d.priceTiers).toEqual([]);
    expect(d.notices).toEqual([]);
  });
});

describe('extractAgeRange', () => {
  it('한국어·일본어·영어 본문에서 참가 연령을 찾는다', () => {
    expect(extractAgeRange('*참여 가능한 연령은 만10세부터 만55세 까지입니다.')).toEqual({ min: 10, max: 55 });
    expect(extractAgeRange('*참여 가능한 연령은 만 5세부터 만 58세 까지')).toEqual({ min: 5, max: 58 });
    expect(extractAgeRange('＊ご参加いただける年齢は12歳から55歳までです。')).toEqual({ min: 12, max: 55 });
    expect(extractAgeRange('*Participants must be between 10 and 55 years old.')).toEqual({ min: 10, max: 55 });
  });

  it('연령 범위가 아니면 null', () => {
    expect(extractAgeRange('만 55세 이상 참가자는 혈압을 측정합니다.')).toBeNull();
    expect(extractAgeRange('')).toBeNull();
  });
});

describe('estimateTotal — 1인당 요금', () => {
  const d = detail({ priceMode: 'perPerson', pricePerPerson: 13000, priceSolo: 16000 });

  it('2인 이상은 1인 요금 × 인원', () => {
    expect(estimateTotal(d, 2)).toBe(26000);
    expect(estimateTotal(d, 5)).toBe(65000);
  });

  it('1인이면 단독 요금', () => {
    expect(estimateTotal(d, 1)).toBe(16000);
  });

  it('단독 요금이 없으면 1인도 1인 요금', () => {
    expect(estimateTotal(detail({ priceMode: 'perPerson', pricePerPerson: 6000 }), 1)).toBe(6000);
  });

  it('인원이 0 이하이거나 요금이 없으면 null', () => {
    expect(estimateTotal(d, 0)).toBeNull();
    expect(estimateTotal(detail({ priceMode: 'perPerson' }), 2)).toBeNull();
  });
});

describe('estimateTotal — 배 1척 · 인원 구간', () => {
  const d = detail({
    priceMode: 'boat',
    priceTiers: [
      { cls: 'middle', maxPeople: 11, price: 150000 },
      { cls: 'middle', maxPeople: 5, price: 130000 },
      { cls: 'luxury', maxPeople: 10, price: 250000 }
    ]
  });

  it('선택 클래스에서 인원을 담는 가장 작은 구간의 요금', () => {
    expect(estimateTotal(d, 3, 'middle')).toBe(130000);
    expect(estimateTotal(d, 5, 'middle')).toBe(130000);
    expect(estimateTotal(d, 6, 'middle')).toBe(150000);
    expect(estimateTotal(d, 8, 'luxury')).toBe(250000);
  });

  it('최대 인원을 넘으면 null', () => {
    expect(estimateTotal(d, 12, 'middle')).toBeNull();
  });

  it('클래스 구분 없는 구간(cls 빈 값)은 모든 클래스에 적용', () => {
    const any = detail({ priceMode: 'boat', priceTiers: [{ cls: '', maxPeople: 6, price: 90000 }] });
    expect(estimateTotal(any, 4, 'luxury')).toBe(90000);
  });
});

describe('estimateTotal — 글 요금·문의', () => {
  it('계산하지 않는다', () => {
    expect(estimateTotal(detail({ priceMode: 'text', pricePerPerson: 1000 }), 2)).toBeNull();
    expect(estimateTotal(detail({ priceMode: 'inquiry' }), 2)).toBeNull();
  });
});

describe('startingPrice · maxPeopleOf', () => {
  it('1인당 요금은 1인 요금을, 배 요금은 해당 클래스 최저 구간을 시작가로', () => {
    expect(startingPrice(detail({ priceMode: 'perPerson', pricePerPerson: 13000, priceSolo: 16000 }))).toBe(13000);
    const boat = detail({
      priceMode: 'boat',
      priceTiers: [
        { cls: 'middle', maxPeople: 11, price: 150000 },
        { cls: 'middle', maxPeople: 5, price: 130000 },
        { cls: 'luxury', maxPeople: 10, price: 250000 }
      ]
    });
    expect(startingPrice(boat, 'middle')).toBe(130000);
    expect(startingPrice(boat, 'luxury')).toBe(250000);
    expect(maxPeopleOf(boat, 'middle')).toBe(11);
    expect(startingPrice(detail({ priceMode: 'text' }))).toBeNull();
  });
});

describe('approxKrw', () => {
  it('엔 × 환율을 천 원 단위로 반올림', () => {
    expect(approxKrw(13000, 8.84)).toBe(115000);
    expect(approxKrw(130000, 8.84)).toBe(1149000);
    expect(approxKrw(0, 8.84)).toBe(0);
  });
});

describe('parsePeopleParam', () => {
  it('예약 링크의 ?people= 을 1~50 정수로만 받는다(그 외는 무시)', () => {
    expect(parsePeopleParam('3')).toBe(3);
    expect(parsePeopleParam('50')).toBe(50);
    expect(parsePeopleParam('0')).toBeUndefined();
    expect(parsePeopleParam('51')).toBeUndefined();
    expect(parsePeopleParam('2.5')).toBeUndefined();
    expect(parsePeopleParam('abc')).toBeUndefined();
    expect(parsePeopleParam(null)).toBeUndefined();
  });
});

describe('bookableOptions — 손님이 고를 수 있는 옵션', () => {
  const options = [
    { key: 'o1', name: '일반', description: '', pricePerPerson: 6000, minPeople: 2, maxPeople: null },
    { key: 'o2', name: '프라이빗', description: '', pricePerPerson: 9000, minPeople: null, maxPeople: null }
  ];
  const ko = detail({ published: true, options });
  const en = detail({ published: true, options: [{ ...options[1], name: 'Private', pricePerPerson: null }] });

  it('공개된 투어면 한국어 구조 + 그 언어 이름', () => {
    expect(bookableOptions('blue-cave-snorkeling', ko, en).map((o) => [o.name, o.pricePerPerson])).toEqual([
      ['일반', 6000],
      ['Private', 9000]
    ]);
  });

  it('공개 여부는 한국어 저장본 기준(번역본의 공개 체크는 보지 않는다)', () => {
    expect(bookableOptions('blue-cave-snorkeling', { ...ko, published: false }, en)).toEqual([]);
    expect(bookableOptions('blue-cave-snorkeling', ko, { ...en, published: false })).toHaveLength(2);
  });

  it('낚시(클래스로 고름)는 옵션 없음', () => {
    expect(bookableOptions('trial-fishing-4h', ko, ko)).toEqual([]);
  });
});

describe('isTourPublished — 상세 공개 여부는 언어 공통', () => {
  it('한국어 저장본만 본다', () => {
    expect(isTourPublished(detail({ published: true }))).toBe(true);
    expect(isTourPublished(detail({ published: false }))).toBe(false);
  });
});

describe('reserveOptionsFor — 예약 폼 옵션(홈·예약 페이지 공용)', () => {
  const ko = {
    published: true,
    options: [
      { key: 'o1', name: '일반 투어', pricePerPerson: 6000, minPeople: 2 },
      { key: 'o2', name: '1인 단독투어', pricePerPerson: 9000, minPeople: 1, maxPeople: 1 }
    ]
  };
  const en = { published: false, options: [{ key: 'o2', name: 'Solo tour' }] };

  it('손님 언어 이름 + 예약 기록용 한국어 이름 + 인원 범위', () => {
    const map = reserveOptionsFor((slug) => (slug === 'blue-cave-snorkeling' ? { base: ko, local: en } : { base: null, local: null }));
    expect(Object.keys(map)).toEqual(['blue-cave-snorkeling']);
    expect(map['blue-cave-snorkeling']).toEqual([
      { key: 'o1', label: '일반 투어', productLabel: '일반 투어', pricePerPerson: 6000, minPeople: 2, maxPeople: null },
      { key: 'o2', label: 'Solo tour', productLabel: '1인 단독투어', pricePerPerson: 9000, minPeople: 1, maxPeople: 1 }
    ]);
  });

  it('한국어가 비공개면 어느 언어에서도 옵션 없음', () => {
    const map = reserveOptionsFor(() => ({ base: { ...ko, published: false }, local: { ...en, published: true } }));
    expect(map).toEqual({});
  });
});

describe('splitLines — 포함 사항 목록', () => {
  it('여러 줄이면 줄바꿈으로만 나눈다(문장 안의 쉼표는 그대로)', () => {
    expect(splitLines('전세 요트 단독 이용\n주요 숙소 무료 픽업, 드랍\n')).toEqual(['전세 요트 단독 이용', '주요 숙소 무료 픽업, 드랍']);
    expect(splitLines('Boat fee\nFree pickup (some areas cannot be served, depending on location)')).toEqual([
      'Boat fee',
      'Free pickup (some areas cannot be served, depending on location)'
    ]);
  });

  it('한 줄이면 쉼표로 나누되 숫자·괄호 안 쉼표는 나누지 않는다', () => {
    expect(splitLines('기본 낚시 도구, 기본 미끼 일체')).toEqual(['기본 낚시 도구', '기본 미끼 일체']);
    expect(splitLines('수중 사진(10장, 원본), 사진 10,000엔 상당')).toEqual(['수중 사진(10장, 원본)', '사진 10,000엔 상당']);
  });

  it('비어 있으면 빈 목록', () => {
    expect(splitLines('')).toEqual([]);
    expect(splitLines(' \n ')).toEqual([]);
  });
});
