import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { site } from '@/config/site.config';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { parseBlogItems, publishedSorted, BLOG_CAROUSEL_LIMIT } from '@/lib/blog';
import {
  HOME_CONTENT_KEYS,
  parseHomeTestimonials,
  parseHomeAssurances,
  parseHomeTourCopy,
  nonEmpty
} from '@/lib/home-content';
import OceanHome, { type HomeContent } from '@/components/OceanHome';
import { cdnMedia } from '@/lib/media';

// 어드민 편집(블로그·일정)을 즉시 반영하기 위해 동적 렌더링.
// (Supabase 미설정 시에도 오버라이드 조회는 빈 객체라 비용 거의 없음)
export const dynamic = 'force-dynamic';

// 홈은 브랜드 검색의 대표 페이지 — 다국어 canonical/hreflang를 명시해 구글에
// ko/en/ja가 같은 페이지의 언어 변형임을 알린다(중복 색인 방지·다국어 신호).
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `${site.url}/${locale}`,
      languages: {
        ko: `${site.url}/ko`,
        en: `${site.url}/en`,
        ja: `${site.url}/ja`,
        'x-default': `${site.url}/${routing.defaultLocale}`
      }
    }
  };
}

/**
 * 홈 — 시네마틱 몰입형(OceanHome). 다이빙·PADI·낚시·스노클링 4종 + 블로그·갤러리·후기·일정.
 * 블로그/일정은 본 사이트와 동일한 출처(어드민 오버라이드 + md/json).
 * 투어·후기·갤러리 카피는 현재 한국어(ocean-home-data.ts) — EN/日 번역은 후속.
 */
export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tSchedule = await getTranslations('schedule');
  const overrides = await getSiteContentMap();

  // 블로그("오늘의 오키니티") — 공개글 최신순
  const posts = publishedSorted(parseBlogItems(overrides[CONTENT_KEYS.blog]?.items)).slice(
    0,
    BLOG_CAROUSEL_LIMIT
  );

  // 일정표 — 어드민이 지정한 일정/휴무만(확정 예약은 공개 일정표에 연동하지 않음).
  const scheduleOverride = overrides[CONTENT_KEYS.schedule]?.items;
  const scheduleItems: ScheduleItem[] = (
    Array.isArray(scheduleOverride) ? (scheduleOverride as ScheduleItem[]) : getSchedule()
  )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const schedule = {
    items: scheduleItems,
    statusLabel: {
      available: tSchedule('statusAvailable'),
      full: tSchedule('statusFull'),
      closed: tSchedule('statusClosed'),
      booked: tSchedule('statusBooked'),
      morning: tSchedule('statusMorning'),
      afternoon: tSchedule('statusAfternoon')
    }
  };

  // 어드민 편집 가능한 미디어(배경영상·투어 카드·갤러리). 비우면 기본값 사용.
  const heroOv = overrides[CONTENT_KEYS.hero] as
    | {
        mediaUrl?: string;
        mediaType?: string;
        eyebrow?: string;
        title?: string;
        subtitle?: string;
        badge1?: string;
        badge2?: string;
        badge3?: string;
        ctaReserve?: string;
        ctaExplore?: string;
        hideEyebrow?: boolean;
        hideSubtitle?: boolean;
        hideBadges?: boolean;
      }
    | undefined;
  const galleryItems = overrides[CONTENT_KEYS.gallery]?.items;
  const galleryImages = Array.isArray(galleryItems)
    ? (galleryItems as { image?: string }[]).map((g) => cdnMedia(g.image)).filter(Boolean)
    : undefined;
  const tourImagesOv = overrides[CONTENT_KEYS.homeTours]?.images;
  const tourImages =
    tourImagesOv && typeof tourImagesOv === 'object'
      ? Object.fromEntries(
          Object.entries(tourImagesOv as Record<string, string>).map(([k, v]) => [k, cdnMedia(v)])
        )
      : undefined;

  // 어드민 hero 텍스트 오버라이드는 한국어로 입력된 운영자 콘텐츠라 기본 로케일(ko)에서만 적용.
  // en/ja는 i18n 번역 기본값(ocean 네임스페이스)을 쓴다(어드민 다국어 입력은 후속 과제).
  // 배경 영상/이미지(media.hero)는 텍스트가 아니므로 전 로케일 공통 적용.
  const isDefaultLocale = locale === routing.defaultLocale;
  const media = {
    hero: heroOv?.mediaUrl?.trim()
      ? { url: cdnMedia(heroOv.mediaUrl), type: heroOv.mediaType }
      : undefined,
    heroText: isDefaultLocale
      ? { eyebrow: heroOv?.eyebrow, title: heroOv?.title, subtitle: heroOv?.subtitle }
      : undefined,
    // 표시/숨김은 구조적 결정이라 전 로케일 공통 적용(배경 미디어와 동일).
    heroHide: {
      eyebrow: !!heroOv?.hideEyebrow,
      subtitle: !!heroOv?.hideSubtitle,
      badges: !!heroOv?.hideBadges
    },
    gallery: galleryImages,
    tours: tourImages
  };

  // 섹션 텍스트 어드민 오버라이드(후기·신뢰·투어카피·Hero 배지/CTA) — 운영자 한국어 입력이라
  // 기본 로케일(ko)에만 적용. en/ja는 i18n 번역 사용(다국어 회귀 방지).
  const content: HomeContent | undefined = isDefaultLocale
    ? {
        heroExtra: {
          badges: [heroOv?.badge1, heroOv?.badge2, heroOv?.badge3]
            .map(nonEmpty)
            .filter((b): b is string => !!b),
          ctaReserve: nonEmpty(heroOv?.ctaReserve),
          ctaExplore: nonEmpty(heroOv?.ctaExplore)
        },
        tours: parseHomeTourCopy(overrides[HOME_CONTENT_KEYS.tourCopy]),
        assurances: parseHomeAssurances(overrides[HOME_CONTENT_KEYS.assurances]),
        testimonials: parseHomeTestimonials(overrides[HOME_CONTENT_KEYS.testimonials])
      }
    : undefined;

  // 구조화 데이터(JSON-LD) — 구글이 "OKINITY = 오키나와 다이빙샵(주소·연락처)"를
  // 명확히 인식하도록. 브랜드/지역 검색 노출에 유리.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: site.url,
    image: `${site.url}/og-image.png`,
    logo: `${site.url}/icon.png`,
    description:
      '오키나와 케라마 블루에서 즐기는 현지 체험 다이빙·스노클링·낚시·PADI 투어. OKINITY.',
    telephone: site.phone,
    email: site.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.line,
      addressLocality: 'Naha',
      addressRegion: 'Okinawa',
      postalCode: site.address.postal.replace(/[^0-9-]/g, ''),
      addressCountry: 'JP'
    },
    areaServed: 'Okinawa, Japan',
    sameAs: [site.contact.kakaoChannel, site.contact.line].filter(Boolean)
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OceanHome posts={posts} locale={locale} schedule={schedule} media={media} content={content} />
    </>
  );
}
