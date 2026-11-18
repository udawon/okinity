import { site } from '@/config/site.config';

/**
 * 구조화 데이터(JSON-LD) 조립 — 순수 함수(테스트 가능). 화면에 보이는 정보만 담는다.
 * 사업체 @id(`/#business`)와 대표 @id(`/#representative`)로 페이지 사이를 같은 대상으로 잇는다.
 */

export const BUSINESS_ID = `${site.url}/#business`;
export const REPRESENTATIVE_ID = `${site.url}/#representative`;

/** 대표 — 허범영과 比嘉海斗는 같은 사람. 언어별 이름 + 나머지 표기 전부(하단·소개에 보이는 이름). */
export function representativePerson(locale: string, jobTitle: string) {
  const rep = site.representative;
  const name = rep.names[locale as keyof typeof rep.names] ?? rep.names.ko;
  return {
    '@type': 'Person' as const,
    '@id': REPRESENTATIVE_ID,
    name,
    alternateName: rep.aliases.filter((n) => n !== name),
    jobTitle,
    worksFor: { '@id': BUSINESS_ID }
  };
}

const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${site.url}${url.startsWith('/') ? '' : '/'}${url}`);

/** 블로그 글(한국어 전용) — 작성일·작성자(대표)·발행처(사업체)·이 날의 투어. */
export function blogPostingJsonLd(input: {
  id: string;
  headline: string;
  date: string;
  description: string;
  images: string[];
  tour: { slug: string; name: string } | null;
}) {
  const author = representativePerson('ko', '대표');
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting' as const,
    headline: input.headline,
    description: input.description,
    datePublished: input.date,
    inLanguage: 'ko',
    mainEntityOfPage: `${site.url}/ko/blog/${input.id}`,
    image: input.images.filter(Boolean).map(absolute),
    author: { '@type': author['@type'], '@id': author['@id'], name: author.name, alternateName: author.alternateName, url: `${site.url}/ko/about` },
    publisher: { '@type': 'Organization' as const, '@id': BUSINESS_ID, name: site.name, logo: `${site.url}/icon.png` },
    ...(input.tour
      ? { about: { '@type': 'TouristTrip' as const, name: input.tour.name, url: `${site.url}/ko/tours/${input.tour.slug}` } }
      : {})
  };
}
