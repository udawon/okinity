import { z } from 'zod';
import { getTourCatalogEntry } from './tour';

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

const todayISO = () => new Date().toISOString().slice(0, 10);

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

export type BlogPhoto = { url: string; index: number };
export type BlogGroup =
  | { kind: 'text'; value: string }
  | { kind: 'photos'; photos: BlogPhoto[] }
  | { kind: 'figure'; url: string; caption: string; index: number }
  | { kind: 'video'; url: string; poster: string; caption: string };

/**
 * 본문 블록을 화면 묶음으로 — 설명 없는 연속 사진은 한 그리드로 묶는다.
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
      const index = photoIndex++;
      if (b.caption?.trim()) {
        out.push({ kind: 'figure', url: b.url, caption: b.caption, index });
        continue;
      }
      const last = out[out.length - 1];
      if (last?.kind === 'photos') last.photos.push({ url: b.url, index });
      else out.push({ kind: 'photos', photos: [{ url: b.url, index }] });
    }
  }
  return out;
}
