import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { parseBlogItems, publishedSorted, BLOG_CAROUSEL_LIMIT } from '@/lib/blog';
import OceanHome from '@/components/OceanHome';

// 어드민 편집(블로그·일정)을 즉시 반영하기 위해 동적 렌더링.
// (Supabase 미설정 시에도 오버라이드 조회는 빈 객체라 비용 거의 없음)
export const dynamic = 'force-dynamic';

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
    | { mediaUrl?: string; mediaType?: string; eyebrow?: string; title?: string; subtitle?: string }
    | undefined;
  const galleryItems = overrides[CONTENT_KEYS.gallery]?.items;
  const galleryImages = Array.isArray(galleryItems)
    ? (galleryItems as { image?: string }[]).map((g) => g.image ?? '').filter(Boolean)
    : undefined;
  const tourImagesOv = overrides[CONTENT_KEYS.homeTours]?.images;
  const tourImages =
    tourImagesOv && typeof tourImagesOv === 'object'
      ? (tourImagesOv as Record<string, string>)
      : undefined;

  const media = {
    hero: heroOv?.mediaUrl?.trim() ? { url: heroOv.mediaUrl, type: heroOv.mediaType } : undefined,
    heroText: {
      eyebrow: heroOv?.eyebrow,
      title: heroOv?.title,
      subtitle: heroOv?.subtitle
    },
    gallery: galleryImages,
    tours: tourImages
  };

  return <OceanHome posts={posts} locale={locale} schedule={schedule} media={media} />;
}
