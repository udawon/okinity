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

/** 투어 구조화 데이터 @id — 홈 업체의 투어 목록과 투어 상세가 같은 대상을 가리키게. */
export function tripId(locale: string, slug: string): string {
  return `${site.url}/${locale}/tours/${slug}#trip`;
}

/**
 * 업체 — 구글 지도 분류(travel_agency)와 같은 TravelAgency(LocalBusiness 하위 분류).
 * 주소는 화면 하단과 같은 사업자 등록지(나하), 샵(기노완)은 구글 지도 링크(hasMap·sameAs)로 연결 — 좌표는 넣지 않는다
 * (샵 좌표를 넣으면 나하 주소와 어긋남). 구글 후기 별점은 넣지 않는다(다른 사이트 후기를 옮기지 말라는 구글 정책).
 */
export function businessJsonLd(input: { locale: string; description: string; tours: { slug: string; name: string }[] }) {
  return {
    '@type': 'TravelAgency' as const,
    '@id': BUSINESS_ID,
    name: site.name,
    // 한글·일문 표기 병기 — "오키니티" 검색어와 브랜드를 연결하는 신호
    alternateName: ['오키니티', 'オキニティ', 'Okinity'],
    url: site.url,
    image: `${site.url}/og-image.png`,
    logo: `${site.url}/icon.png`,
    description: input.description,
    telephone: site.phone,
    email: site.contact.email,
    address: {
      '@type': 'PostalAddress' as const,
      streetAddress: site.address.line,
      addressLocality: 'Naha',
      addressRegion: 'Okinawa',
      postalCode: site.address.postal.replace(/[^0-9-]/g, ''),
      addressCountry: 'JP'
    },
    areaServed: 'Okinawa, Japan',
    hasMap: site.googleMapsUrl,
    sameAs: [site.contact.kakaoChannel, site.contact.line, site.contact.instagram, site.googleMapsUrl].filter(Boolean),
    hasOfferCatalog: {
      '@type': 'OfferCatalog' as const,
      name: site.name,
      itemListElement: input.tours.map((t) => ({
        '@type': 'Offer' as const,
        itemOffered: {
          '@type': 'TouristTrip' as const,
          '@id': tripId(input.locale, t.slug),
          name: t.name,
          url: `${site.url}/${input.locale}/tours/${t.slug}`
        }
      }))
    }
  };
}

const YEN_RE = /(?:[¥￥]\s?([\d,]+))|(?:([\d,]+)\s?(?:엔|円|yen|JPY))/i;

/** 가격 문장의 첫 금액(엔) — "1인 6,000엔(2인이상) / 단독 9,000엔" → 6000. 없으면 null. */
export function firstYenAmount(text: string): number | null {
  const m = YEN_RE.exec(text);
  const n = m ? Number((m[1] ?? m[2]).replace(/,/g, '')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 요트·낚시 — 클래스별 가격 차이가 커서 AI용에는 숫자 없이(2026-11-18 원님 결정, 화면 금액은 그대로). */
const CONSULT_LABEL: Record<string, string> = { ko: '상담 요망', en: 'Price on consultation', ja: '要相談' };

/**
 * 투어 가격 — 시작 가격(화면 카드와 같은 규칙으로 구한 숫자) + 화면의 가격 문장 그대로.
 * "~부터"라 확정가가 아님이 전달된다(요금 확정 안내 문구는 화면·AI 모두 넣지 않음 — 원님 결정).
 */
export function tourOffer(input: { locale: string; url: string; amount: number | null; text: string; consult: boolean }) {
  const base = { '@type': 'Offer' as const, url: input.url, priceCurrency: 'JPY' };
  if (input.consult) return { ...base, description: CONSULT_LABEL[input.locale] ?? CONSULT_LABEL.ko };
  const text = input.text.trim();
  if (input.amount == null && !text) return null;
  return { ...base, ...(input.amount != null ? { price: input.amount } : {}), ...(text ? { description: text } : {}) };
}

/** 투어 상세 — 이름·설명·사진·제공자(업체 @id)·가격. 화면에 보이는 정보만. */
export function touristTripJsonLd(input: {
  locale: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  offer: ReturnType<typeof tourOffer>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip' as const,
    '@id': tripId(input.locale, input.slug),
    name: input.name,
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    url: `${site.url}/${input.locale}/tours/${input.slug}`,
    inLanguage: input.locale,
    image: input.images.filter(Boolean).map(absolute),
    provider: { '@type': 'TravelAgency' as const, '@id': BUSINESS_ID, name: site.name },
    ...(input.offer ? { offers: input.offer } : {})
  };
}

/** 소개 — 대표(자격은 화면의 자격 목록 그대로, 사진)와 업체를 잇는다. */
export function aboutPageJsonLd(input: { locale: string; jobTitle: string; image: string; credentials: string[] }) {
  const person = representativePerson(input.locale, input.jobTitle);
  const credentials = input.credentials.map((c) => c.trim()).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage' as const,
    url: `${site.url}/${input.locale}/about`,
    inLanguage: input.locale,
    about: { '@id': BUSINESS_ID },
    mainEntity: {
      ...person,
      ...(input.image ? { image: absolute(input.image) } : {}),
      ...(credentials.length
        ? { hasCredential: credentials.map((name) => ({ '@type': 'EducationalOccupationalCredential' as const, name })) }
        : {})
    }
  };
}

/** <script type="application/ld+json"> 에 넣을 문자열 — `<` 를 이스케이프해 어드민 입력의 `</script>` 로 스크립트가 닫히지 않게. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
