import 'server-only';

/**
 * 구글맵(Places API New) 후기 연동 — 서버 전용.
 *
 * GOOGLE_MAPS_API_KEY + GOOGLE_PLACE_ID 환경변수가 있으면 Place Details에서
 * 별점·후기(최대 5개, 관련성순 — API 제한)를 받아온다. 미설정/실패 시 null을
 * 반환해 기존 후기(어드민/샘플)로 폴백한다.
 *
 * 정책(https://developers.google.com/maps/documentation/places/web-service/policies):
 * - 후기 텍스트는 수정 없이 그대로 표시, 작성자 표기(이름·사진·프로필 링크) 유지
 * - 필터링(별점 높은 후기만) 시 그 기준을 화면에 공지해야 한다 → 섹션에 안내 문구 표시
 * - 리뷰를 DB에 저장하지 않는다 — fetch 캐시(24시간 revalidate)만 사용
 */

export type GoogleReview = {
  rating: number;
  text: string;
  authorName: string;
  authorPhoto?: string;
  authorUri?: string;
  relativeTime?: string;
  reviewUri?: string;
};

export type GoogleReviewsData = {
  /** 업체 평균 별점 (예: 4.9) */
  rating: number;
  /** 전체 후기 수 */
  count: number;
  /** 별점 높은 순 정렬된 후기 (최소 별점 필터 적용 후) */
  reviews: GoogleReview[];
  /** 구글맵 업체 페이지 링크 */
  placeUri?: string;
  /** 적용된 최소 별점 — 화면 공지 문구용 */
  minRating: number;
};

/** 표시 최소 별점 — 이 값 미만 후기는 걸러진다(화면 공지 문구와 일치해야 함). */
export const GOOGLE_REVIEW_MIN_RATING = 4;

const LANG: Record<string, string> = { ko: 'ko', en: 'en', ja: 'ja' };

type ApiReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
};

export async function getGoogleReviews(
  locale: string,
  maxCount: number
): Promise<GoogleReviewsData | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;

  try {
    const lang = LANG[locale] ?? 'ko';
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${lang}&regionCode=JP`,
      {
        headers: {
          'X-Goog-Api-Key': key,
          // 필요한 필드만 명시 — '*' 는 최고가 SKU 과금이 되므로 금지
          'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews'
        },
        // 6시간 캐시 — 새 후기 반영 지연 최소화. 로케일 3개 × 하루 4회 = 월 ~360콜(무료 1,000콜 내).
        // 후기 저장(DB 영속)은 하지 않는다.
        next: { revalidate: 21600 }
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: ApiReview[];
    };
    if (typeof data.rating !== 'number') return null;

    const reviews = (data.reviews ?? [])
      .map((r) => ({
        rating: r.rating ?? 0,
        text: r.text?.text?.trim() || r.originalText?.text?.trim() || '',
        authorName: r.authorAttribution?.displayName ?? '',
        authorPhoto: r.authorAttribution?.photoUri,
        authorUri: r.authorAttribution?.uri,
        relativeTime: r.relativePublishTimeDescription,
        reviewUri: r.googleMapsUri
      }))
      // 본문 없는 별점-온리 후기 제외 + 최소 별점 필터(화면에 공지)
      .filter((r) => r.text && r.rating >= GOOGLE_REVIEW_MIN_RATING)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, maxCount);

    if (reviews.length === 0) return null; // 표시할 후기가 없으면 기존 후기로 폴백

    return {
      rating: data.rating,
      count: data.userRatingCount ?? reviews.length,
      reviews,
      placeUri: data.googleMapsUri,
      minRating: GOOGLE_REVIEW_MIN_RATING
    };
  } catch {
    return null;
  }
}
