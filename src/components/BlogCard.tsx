import { Link } from '@/i18n/routing';
import { type BlogPost } from '@/lib/blog';
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
  return (
    <Link href={`/blog/${post.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-card border border-white/10 bg-white/[0.05] backdrop-blur-sm transition-colors group-hover:border-white/25">
        <div className="aspect-[4/3] w-full overflow-hidden bg-white/5">
          {post.thumbnail ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${cdnMedia(post.thumbnail)})` }}
              role="img"
              aria-label={post.title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
              이미지 없음
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          {post.date && (
            <p className="text-xs tracking-wide text-white/45">{formatDate(post.date, locale)}</p>
          )}
          <h3 className="mt-1.5 line-clamp-2 font-serif text-lg leading-snug text-white">
            {post.title || '(제목 없음)'}
          </h3>
        </div>
      </article>
    </Link>
  );
}
