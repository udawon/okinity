import { z } from 'zod';

/**
 * 블로그("오늘의 오키니티") 데이터 모델 — 범용(universal) 모듈.
 * server-only 의존이 없어 서버 페이지·액션과 클라이언트 에디터 양쪽에서 import 가능.
 *
 * 저장: site_content 키 'blog' → { items: BlogPost[] } (언어 공유, JSONB).
 * 본문은 텍스트/이미지 블록의 순서 배열.
 */

export const BlogBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string().default('') }),
  z.object({
    type: z.literal('image'),
    url: z.string().default(''),
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
  blocks: z.array(BlogBlockSchema).default([])
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
    blocks: [{ type: 'text', value: '' }]
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

/** 카드/목록용 본문 요약 — 첫 텍스트 블록을 잘라서. */
export function excerptOf(post: BlogPost, max = 80): string {
  const text = post.blocks.find((b) => b.type === 'text') as
    | Extract<BlogBlock, { type: 'text' }>
    | undefined;
  const s = (text?.value ?? '').trim().replace(/\s+/g, ' ');
  return s.length > max ? s.slice(0, max) + '…' : s;
}
