import { describe, expect, it } from 'vitest';
import {
  aboutPageJsonLd,
  blogPostingJsonLd,
  businessJsonLd,
  firstYenAmount,
  jsonLdHtml,
  representativePerson,
  touristTripJsonLd,
  tourOffer
} from './structured-data';

describe('representativePerson — 대표(한국·일본 이름이 같은 사람)', () => {
  it('언어별 대표 이름, 나머지 표기는 alternateName 으로 전부', () => {
    const ko = representativePerson('ko', '대표');
    expect(ko.name).toBe('허범영');
    expect(ko.alternateName).toContain('比嘉海斗');
    expect(ko.alternateName).toContain('포뇨강사');
    expect(ko.alternateName).not.toContain('허범영');
    expect(ko['@id']).toBe('https://okinity.com/#representative');
    expect(ko.worksFor).toEqual({ '@id': 'https://okinity.com/#business' });
    expect(representativePerson('ja', '代表').name).toBe('比嘉海斗');
    expect(representativePerson('en', 'Representative').name).toBe('Beomyoung Heo');
  });
});

describe('blogPostingJsonLd — 블로그 글 구조화 데이터', () => {
  const base = {
    id: 'b-1',
    headline: '푸른동굴 투어',
    date: '2026-11-05',
    description: '2026년 11월 5일 오키니티 현장 기록.',
    images: ['/cdn/blog/a.jpg', 'https://cdn.example.com/b.jpg', '']
  };

  it('작성일·작성자(대표와 같은 사람)·발행처·주소', () => {
    const ld = blogPostingJsonLd({ ...base, tour: null });
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('푸른동굴 투어');
    expect(ld.datePublished).toBe('2026-11-05');
    expect(ld.inLanguage).toBe('ko');
    expect(ld.mainEntityOfPage).toBe('https://okinity.com/ko/blog/b-1');
    expect(ld.author).toMatchObject({ '@id': 'https://okinity.com/#representative', name: '허범영' });
    expect(ld.publisher).toMatchObject({ '@id': 'https://okinity.com/#business', name: 'OKINITY' });
    expect(ld.about).toBeUndefined();
  });

  it('사진은 절대 주소로, 빈 값은 뺀다', () => {
    const ld = blogPostingJsonLd({ ...base, tour: null });
    expect(ld.image).toEqual(['https://okinity.com/cdn/blog/a.jpg', 'https://cdn.example.com/b.jpg']);
  });

  it('이 날의 투어가 있으면 about 으로 연결', () => {
    const ld = blogPostingJsonLd({ ...base, tour: { slug: 'blue-cave-dive', name: '푸른동굴 보트 체험다이빙' } });
    expect(ld.about).toEqual({
      '@type': 'TouristTrip',
      name: '푸른동굴 보트 체험다이빙',
      url: 'https://okinity.com/ko/tours/blue-cave-dive'
    });
  });
});

describe('businessJsonLd — 업체(구글 지도와 같은 분류·연결)', () => {
  const b = businessJsonLd({
    locale: 'en',
    description: 'Local Okinawa dive shop',
    tours: [{ slug: 'blue-cave-snorkeling', name: 'Blue Cave Snorkeling' }]
  });
  it('구글 지도 분류(여행사)와 같은 TravelAgency, 언어별 설명', () => {
    expect(b['@type']).toBe('TravelAgency');
    expect(b['@id']).toBe('https://okinity.com/#business');
    expect(b.description).toBe('Local Okinawa dive shop');
  });
  it('주소는 화면(하단)과 같은 사업자 등록지, 좌표는 넣지 않음', () => {
    expect(b.address.addressLocality).toBe('Naha');
    expect(b).not.toHaveProperty('geo');
  });
  it('공식 채널 + 구글 지도로 같은 업체임을 연결', () => {
    expect(b.sameAs).toEqual([
      'https://pf.kakao.com/_GLkxlX',
      'https://lin.ee/vdxgimQ',
      'https://www.instagram.com/okinity_official/',
      'https://maps.google.com/?cid=4404185334192370822'
    ]);
    expect(b.hasMap).toBe('https://maps.google.com/?cid=4404185334192370822');
  });
  it('공개 투어 목록 — 투어 페이지 구조화 데이터와 같은 @id', () => {
    expect(b.hasOfferCatalog.itemListElement[0].itemOffered).toEqual({
      '@type': 'TouristTrip',
      '@id': 'https://okinity.com/en/tours/blue-cave-snorkeling#trip',
      name: 'Blue Cave Snorkeling',
      url: 'https://okinity.com/en/tours/blue-cave-snorkeling'
    });
  });
  it('다른 사이트(구글) 후기 별점은 넣지 않는다(구글 정책)', () => {
    expect(b).not.toHaveProperty('aggregateRating');
  });
});

describe('firstYenAmount — 가격 문장의 첫 금액(시작 가격)', () => {
  it('엔·円·¥ 표기', () => {
    expect(firstYenAmount('1인 6,000엔(2인이상) / 1인 단독투어 9,000엔')).toBe(6000);
    expect(firstYenAmount('1인 24,000엔~(2인이상), 2인이상 참가 가능. 추가 1회 다이빙 +5,000엔')).toBe(24000);
    expect(firstYenAmount('105,000엔 (3일차 보트다이빙 승선료 포함)')).toBe(105000);
    expect(firstYenAmount('¥13,000 per person')).toBe(13000);
    expect(firstYenAmount('1名 13,000円')).toBe(13000);
  });
  it('금액이 없으면 null', () => {
    expect(firstYenAmount('다이빙 포인트에 따라 달라집니다.')).toBeNull();
    expect(firstYenAmount('문의')).toBeNull();
    expect(firstYenAmount('')).toBeNull();
  });
});

describe('tourOffer — 투어 가격(화면 카드와 같은 규칙)', () => {
  const url = 'https://okinity.com/ko/tours/x';
  it('시작 가격 + 화면 문장 그대로', () => {
    expect(tourOffer({ locale: 'ko', url, amount: 6000, text: '1인 6,000엔(2인이상)', consult: false })).toEqual({
      '@type': 'Offer',
      url,
      priceCurrency: 'JPY',
      price: 6000,
      description: '1인 6,000엔(2인이상)'
    });
  });
  it('요트·낚시는 숫자 없이 상담 요망(언어별)', () => {
    const o = tourOffer({ locale: 'ja', url, amount: 130000, text: '130,000엔', consult: true });
    expect(o).toEqual({ '@type': 'Offer', url, priceCurrency: 'JPY', description: '要相談' });
    expect(tourOffer({ locale: 'ko', url, amount: null, text: '', consult: true })?.description).toBe('상담 요망');
  });
  it('금액 없이 문장만 있으면 문장만, 둘 다 없으면 null', () => {
    expect(tourOffer({ locale: 'ko', url, amount: null, text: '다이빙 포인트에 따라 달라집니다.', consult: false })).toEqual({
      '@type': 'Offer',
      url,
      priceCurrency: 'JPY',
      description: '다이빙 포인트에 따라 달라집니다.'
    });
    expect(tourOffer({ locale: 'ko', url, amount: null, text: '  ', consult: false })).toBeNull();
  });
});

describe('touristTripJsonLd — 투어 상세', () => {
  it('이름·설명·사진(절대 주소)·제공자(@id)·가격', () => {
    const t = touristTripJsonLd({
      locale: 'ko',
      slug: 'kerama-dive',
      name: '케라마 체험다이빙',
      description: '케라마 블루',
      images: ['/a.jpg', 'https://cdn.example/b.jpg'],
      offer: null
    });
    expect(t['@type']).toBe('TouristTrip');
    expect(t['@id']).toBe('https://okinity.com/ko/tours/kerama-dive#trip');
    expect(t.url).toBe('https://okinity.com/ko/tours/kerama-dive');
    expect(t.inLanguage).toBe('ko');
    expect(t.image).toEqual(['https://okinity.com/a.jpg', 'https://cdn.example/b.jpg']);
    expect(t.provider).toEqual({ '@type': 'TravelAgency', '@id': 'https://okinity.com/#business', name: 'OKINITY' });
    expect(t).not.toHaveProperty('offers');
  });
});

describe('aboutPageJsonLd — 소개(대표 자격은 화면의 자격 목록 그대로)', () => {
  it('대표 Person 에 자격·사진, 업체와 연결', () => {
    const a = aboutPageJsonLd({
      locale: 'ko',
      jobTitle: '대표',
      image: 'https://cdn.example/p.jpg',
      credentials: ['PADI 오픈워터 스쿠버 인스트럭터', '응급처치(EFR) 강사']
    });
    expect(a['@type']).toBe('AboutPage');
    expect(a.url).toBe('https://okinity.com/ko/about');
    expect(a.about).toEqual({ '@id': 'https://okinity.com/#business' });
    expect(a.mainEntity['@id']).toBe('https://okinity.com/#representative');
    expect(a.mainEntity.image).toBe('https://cdn.example/p.jpg');
    expect(a.mainEntity.hasCredential).toEqual([
      { '@type': 'EducationalOccupationalCredential', name: 'PADI 오픈워터 스쿠버 인스트럭터' },
      { '@type': 'EducationalOccupationalCredential', name: '응급처치(EFR) 강사' }
    ]);
  });
  it('자격·사진이 비면 그 항목은 넣지 않음', () => {
    const a = aboutPageJsonLd({ locale: 'en', jobTitle: 'Representative', image: '', credentials: [] });
    expect(a.mainEntity).not.toHaveProperty('hasCredential');
    expect(a.mainEntity).not.toHaveProperty('image');
  });
});

describe('jsonLdHtml — <script> 안에 넣을 문자열(어드민 입력의 </script> 차단)', () => {
  it('< 를 이스케이프해 스크립트가 중간에 닫히지 않게', () => {
    const html = jsonLdHtml({ name: '</script><script>alert(1)</script>' });
    expect(html).not.toContain('</script>');
    expect(JSON.parse(html)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
