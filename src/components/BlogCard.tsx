import { Link } from '@/i18n/routing';
import { type BlogPost, coverOf, displayTitle, postTourSlug } from '@/lib/blog';
import { getTourCatalogEntry } from '@/lib/tour';
import { cdnMedia } from '@/lib/media';

function formatDate(date: string, locale: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

/** 블로그 카드 — 가로형 썸네일(4:3) + 날짜 + 제목. 클릭 시 /blog/[id]. */
export default function BlogCard({ post, locale }: { post: BlogPost; locale: string }) {
  const cover = coverOf(post);
  // 제목 앞 날짜(260924)는 날짜 줄과 중복이라 떼고, 연결된 투어명을 작은 라벨로.
  const title = displayTitle(post.title);
  const tourSlug = postTourSlug(post);
  const tourName = tourSlug ? getTourCatalogEntry(tourSlug)?.name : undefined;
  return (
    // aria-label 명시 — 카드 내용이 리빌 애니메이션 초기(투명) 상태일 때도
    // 스크린리더가 링크 이름을 안정적으로 읽도록(2026-07-22 QA ISSUE-005)
    <Link
      href={`/blog/${post.id}`}
      className="group block h-full"
      aria-label={title || undefined}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-card border border-white/10 bg-white/[0.05] backdrop-blur-sm transition-colors group-hover:border-white/25">
        <div className="aspect-[4/3] w-full overflow-hidden bg-white/5">
          {cover ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${cdnMedia(cover)})` }}
              role="img"
              aria-label={title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
              이미지 없음
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs tracking-wide text-white/55">
            {tourName && <span className="font-semibold text-[#5fc6ef]">{tourName} · </span>}
            {post.date && formatDate(post.date, locale)}
          </p>
          <h3 className="mt-1.5 line-clamp-2 break-keep font-serif text-lg leading-snug text-white">
            {title || '(제목 없음)'}
          </h3>
        </div>
      </article>
    </Link>
  );
}
