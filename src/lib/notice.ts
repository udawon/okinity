import { z } from 'zod';

/**
 * 공지사항 데이터 모델 — 범용 모듈(server-only 의존 없음).
 * 블로그보다 단순: 제목·날짜·공개여부·고정여부 + 본문 텍스트(여러 줄).
 * 저장: site_content 키 'notice' → { items: NoticePost[] }.
 */

export const NoticePostSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  date: z.string(), // YYYY-MM-DD
  published: z.boolean().default(false),
  pinned: z.boolean().default(false),
  body: z.string().default('')
});
export type NoticePost = z.infer<typeof NoticePostSchema>;

const todayISO = () => new Date().toISOString().slice(0, 10);

/** 새 공지 기본값 — 초안(비공개)으로 생성. */
export function newNoticePost(): NoticePost {
  return {
    id: `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    date: todayISO(),
    published: false,
    pinned: false,
    body: ''
  };
}

/** site_content 'notice' 의 value.items 를 안전 파싱. */
export function parseNoticeItems(raw: unknown): NoticePost[] {
  if (!Array.isArray(raw)) return [];
  const out: NoticePost[] = [];
  for (const item of raw) {
    const parsed = NoticePostSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** 고정(pinned) 먼저, 그다음 최신순(날짜 내림차순). */
export function sortNotices(posts: NoticePost[]): NoticePost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
  });
}

/** 공개 공지만 정렬해서. */
export function publishedNotices(posts: NoticePost[]): NoticePost[] {
  return sortNotices(posts.filter((p) => p.published));
}

/** 목록용 본문 요약. */
export function excerptOf(post: NoticePost, max = 100): string {
  const s = post.body.trim().replace(/\s+/g, ' ');
  return s.length > max ? s.slice(0, max) + '…' : s;
}
