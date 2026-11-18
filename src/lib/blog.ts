import { z } from 'zod';
import { getTourCatalogEntry } from './tour';
import { okinawaTodayKey } from './okinawa-date';

/**
 * 블로그("오늘의 오키니티") 데이터 모델 — 범용(universal) 모듈.
 * server-only 의존이 없어 서버 페이지·액션과 클라이언트 에디터 양쪽에서 import 가능.
 *
 * 저장: site_content 키 'blog' → { items: BlogPost[] } (언어 공유, JSONB).
 * 본문은 텍스트/이미지/영상 블록의 순서 배열.
 */

export const BlogBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string().default('') }),
  z.object({
    type: z.literal('image'),
    url: z.string().default(''),
    caption: z.string().optional().default('')
  }),
  z.object({
    type: z.literal('video'),
    url: z.string().default(''),
    /** 첫 프레임에서 자동 생성한 썸네일. 있으면 방문자는 재생 전까지 영상을 내려받지 않는다. */
    poster: z.string().optional().default(''),
    caption: z.string().optional().default('')
  })
]);
export type BlogBlock = z.infer<typeof BlogBlockSchema>;

export const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  thumbnail: z.string().optional().default(''),
  date: z.string(), // YYYY-MM-DD
  published: z.boolean().default(false),
  blocks: z.array(BlogBlockSchema).default([]),
  /** 이 글이 기록한 투어(slug). 빈 값 = 제목으로 자동 추론, 'none' = 연결 안 함. */
  tourSlug: z.string().default('').catch('')
});
export type BlogPost = z.infer<typeof BlogPostSchema>;

/** 메인 캐러셀에 노출하는 최대 글 수. */
export const BLOG_CAROUSEL_LIMIT = 8;

// 새 글 기본 날짜 = 오키나와(영업지) 오늘 — UTC 기준이면 한국·일본 0~9시에 전날로 찍힌다.
const todayISO = () => okinawaTodayKey();

/** 새 글 기본값 — 초안(비공개)으로 생성. */
export function newBlogPost(): BlogPost {
  return {
    id: `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    thumbnail: '',
    date: todayISO(),
    published: false,
    blocks: [{ type: 'text', value: '' }],
    tourSlug: ''
  };
}

/** site_content 'blog' 의 value.items 를 안전 파싱. 잘못된 항목은 건너뛴다. */
export function parseBlogItems(raw: unknown): BlogPost[] {
  if (!Array.isArray(raw)) return [];
  const out: BlogPost[] = [];
  for (const item of raw) {
    const parsed = BlogPostSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** 최신순(날짜 내림차순, 동일 날짜는 id 역순). */
export function sortByDateDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** 공개글만 최신순. */
export function publishedSorted(posts: BlogPost[]): BlogPost[] {
  return sortByDateDesc(posts.filter((p) => p.published));
}

/**
 * 카드/목록용 대표 이미지 — 지정 썸네일이 없으면 본문에서 찾는다.
 * 영상 블록은 원본이 아니라 포스터(첫 프레임)를 쓴다 — 목록에서 영상을 내려받지 않기 위해.
 */
export function coverOf(post: BlogPost): string {
  if (post.thumbnail) return post.thumbnail;
  for (const b of post.blocks) {
    if (b.type === 'image' && b.url) return b.url;
    if (b.type === 'video' && b.poster) return b.poster;
  }
  return '';
}

/** 카드/목록용 본문 요약 — 첫 텍스트 블록을 잘라서. */
export function excerptOf(post: BlogPost, max = 80): string {
  const text = post.blocks.find((b) => b.type === 'text') as
    | Extract<BlogBlock, { type: 'text' }>
    | undefined;
  const s = (text?.value ?? '').trim().replace(/\s+/g, ' ');
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/** 'YYYY-MM-DD' → '2026년 11월 5일'(문자열 그대로 읽어 시간대 영향 없음). 형식이 아니면 그대로. */
export function koDateLabel(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : date;
}

/**
 * 검색 결과·브라우저 탭 제목 — 같은 제목("푸른동굴 투어")의 글이 많아 날짜로 구분한다.
 * 화면 제목(h1)은 그대로 두고 여기에만 붙인다(2026-11-18 원님 결정).
 */
export function blogSeoTitle(post: BlogPost): string {
  const label = koDateLabel(post.date);
  return `${displayTitle(post.title) || '블로그'}${label ? ` (${label})` : ''}`;
}

/**
 * 검색 요약문 — 본문이 있으면 본문 요약, 없으면 날짜·이 날의 투어·사진/영상 수로 만든 문장.
 * 본문이 없는 글에 내용을 지어내지 않는다(현장 사실은 작성자만 안다).
 */
export function blogDescription(post: BlogPost, tourName: string | null, max = 150): string {
  const excerpt = excerptOf(post, max);
  if (excerpt) return excerpt;
  const photos = post.blocks.filter((b) => b.type === 'image' && b.url).length;
  const videos = post.blocks.filter((b) => b.type === 'video' && b.url).length;
  const counts = [photos && `사진 ${photos}장`, videos && `영상 ${videos}개`].filter(Boolean).join(' · ');
  const head = [koDateLabel(post.date), '오키니티', tourName, '현장 기록.'].filter(Boolean).join(' ');
  return counts ? `${head} ${counts}.` : head;
}

/**
 * 어드민 본문 칸 안내(빈 칸에만 흐리게 보임) — 2~3분 안에 현장 사실을 적도록 질문으로.
 * AI·검색이 인용하는 건 이런 현장 정보다(다른 사이트에 없음).
 */
export const BLOG_WRITING_GUIDE = [
  '오늘 어디서 진행했나요? (장소가 바뀌었다면 이유도)',
  '바다는 어땠나요? (파도·수온·시야)',
  '무엇을 만났나요? (거북이·니모 등)',
  '다음 손님에게 한마디 팁은?',
  '',
  '예) 파도가 높아 마에다 플랫에서 진행. 수온 25도, 시야 15m, 거북이 2마리!'
].join('\n');

/** 블로그 투어 연결에서 '연결 안 함'을 뜻하는 값. */
export const BLOG_TOUR_NONE = 'none';

/** 표시용 제목 — 앞의 6자리 날짜(예: 260924)는 날짜 줄과 중복이라 뗀다. 저장값은 그대로. */
export function displayTitle(title: string): string {
  return title.replace(/^\s*\d{6}(?=\s)/, '').trim();
}

/**
 * 제목으로 투어 추론 — 확실할 때만(종류 키워드까지 있어야) 연결한다.
 * 기존 글(2026-09 기준 24개)에 투어 칸을 다시 입력하지 않아도 되도록. 모호하면 null.
 * (푸른동굴이 막히는 날은 마에다 비치에서 같은 투어를 진행한다 — 운영 공지 기준)
 */
export function inferTourSlug(title: string): string | null {
  const t = title.replace(/\s+/g, '');
  const cave = /푸른동굴|마에다/.test(t);
  if (cave && /스노클링/.test(t)) return 'blue-cave-snorkeling';
  if (cave && /스쿠버|다이빙/.test(t)) return 'blue-cave-dive';
  if (/펀다이빙/.test(t)) return 'fun-dive';
  if (/(케라마|치비시)[^]*체험다이빙/.test(t)) return 'kerama-dive';
  return null;
}

/** 글이 연결된 투어 — 어드민 지정값 우선, 없으면 제목 추론. */
export function postTourSlug(post: BlogPost): string | null {
  if (post.tourSlug === BLOG_TOUR_NONE) return null;
  if (post.tourSlug && getTourCatalogEntry(post.tourSlug)) return post.tourSlug;
  return inferTourSlug(post.title);
}

export type BlogPhoto = { url: string; index: number; caption: string };
export type BlogGroup =
  | { kind: 'text'; value: string }
  | { kind: 'photos'; photos: BlogPhoto[] }
  | { kind: 'video'; url: string; poster: string; caption: string };

/**
 * 본문 블록을 화면 묶음으로 — 연속 사진은 설명 유무와 관계없이 한 슬라이드로 묶고,
 * 설명은 사진마다 들고 간다(슬라이드 아래 표시).
 * 사진 index 는 글 전체의 사진 순번(라이트박스에서 이어서 넘기기용). 빈 URL 은 건너뛴다.
 */
export function groupBlocks(blocks: BlogBlock[]): BlogGroup[] {
  const out: BlogGroup[] = [];
  let photoIndex = 0;
  for (const b of blocks) {
    if (b.type === 'text') {
      if (b.value.trim()) out.push({ kind: 'text', value: b.value });
    } else if (b.type === 'video') {
      if (b.url) out.push({ kind: 'video', url: b.url, poster: b.poster ?? '', caption: b.caption ?? '' });
    } else if (b.url) {
      const photo = { url: b.url, index: photoIndex++, caption: b.caption?.trim() ?? '' };
      const last = out[out.length - 1];
      if (last?.kind === 'photos') last.photos.push(photo);
      else out.push({ kind: 'photos', photos: [photo] });
    }
  }
  return out;
}
