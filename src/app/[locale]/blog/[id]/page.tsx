import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import {
  coverOf,
  displayTitle,
  excerptOf,
  groupBlocks,
  parseBlogItems,
  postTourSlug,
  publishedSorted,
  type BlogPost
} from '@/lib/blog';
import { getTourCatalogEntry, resolveTourDetail, tourImages } from '@/lib/tour';
import { cdnMedia } from '@/lib/media';
import { localeAlternates } from '@/lib/seo';
import { isAdminPreview } from '@/lib/admin-preview';
import Container from '@/components/Container';
import DraftNotice from '@/components/DraftNotice';
import BlogBody from '@/components/blog/BlogBody';

export const dynamic = 'force-dynamic';

function formatDate(date: string, locale: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  // 날짜만 저장('YYYY-MM-DD' = UTC 자정) — UTC 로 읽어야 하루 밀림이 없다.
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...(opts ?? { year: 'numeric', month: 'long', day: 'numeric' })
  }).format(d);
}

/**
 * 초안(비공개)은 어드민 로그인 상태에서만 열린다 — 공개 전 미리보기용.
 * 그 외에는 지금까지와 동일하게 없는 글로 취급한다.
 */
async function loadPosts(id: string): Promise<{ post: BlogPost | null; all: BlogPost[] }> {
  const value = await getSiteContent(CONTENT_KEYS.blog);
  const all = parseBlogItems(value?.items);
  const post = all.find((p) => p.id === id) ?? null;
  if (!post) return { post: null, all };
  if (post.published) return { post, all };
  return { post: (await isAdminPreview()) ? post : null, all };
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const { post } = await loadPosts(id);
  return {
    title: post ? displayTitle(post.title) || '블로그' : '블로그',
    description: post ? excerptOf(post) : undefined,
    // 초안은 어드민에게만 보이지만, 색인 대상이 아님을 명시해 둔다.
    ...(post && !post.published ? { robots: { index: false, follow: false } } : {}),
    alternates: localeAlternates(locale, `/blog/${id}`)
  };
}

function PostCard({ post, label }: { post: BlogPost; label?: string }) {
  const cover = coverOf(post);
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group flex gap-3 rounded-2xl border border-white/10 bg-[#061522]/60 p-3 backdrop-blur-md transition-colors hover:border-white/30"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cdnMedia(cover)} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="h-16 w-20 shrink-0 rounded-lg bg-white/5" />
      )}
      <span className="min-w-0">
        {label && <span className="block text-xs font-semibold text-[#5fc6ef]">{label}</span>}
        <span className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug text-white">
          {displayTitle(post.title) || '(제목 없음)'}
        </span>
        <span className="mt-0.5 block text-xs text-white/55">{formatDate(post.date, 'ko', { month: 'long', day: 'numeric' })}</span>
      </span>
    </Link>
  );
}

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  // 블로그·공지는 한국어 콘텐츠 전용 — EN/JA에서는 홈으로 보낸다(메뉴에서도 숨김).
  if (locale !== 'ko') redirect(`/${locale}`);
  setRequestLocale(locale);

  const { post, all } = await loadPosts(id);
  if (!post) notFound();

  const title = displayTitle(post.title) || '(제목 없음)';
  const groups = groupBlocks(post.blocks);
  const photoCount = groups.reduce((n, g) => n + (g.kind === 'photos' ? g.photos.length : g.kind === 'figure' ? 1 : 0), 0);
  const videoCount = groups.filter((g) => g.kind === 'video').length;

  // 이 날의 투어 — 어드민 지정 또는 제목 추론. 투어 사진·요약은 한국어 투어 상세에서.
  const tourSlug = postTourSlug(post);
  const tourEntry = tourSlug ? getTourCatalogEntry(tourSlug) : undefined;
  const tourDetail = tourEntry ? resolveTourDetail(tourEntry.slug, await getSiteContent(CONTENT_KEYS.tour(tourEntry.slug))) : null;
  const tourCover = tourDetail ? tourImages(tourDetail)[0] : undefined;

  // 이전(더 오래된) · 다음(더 최근) 글, 그리고 다른 기록 — 공개글 최신순 기준
  const list = publishedSorted(all);
  const pos = list.findIndex((p) => p.id === post.id);
  const newer = pos > 0 ? list[pos - 1] : null;
  const older = pos >= 0 && pos < list.length - 1 ? list[pos + 1] : null;
  const others = list
    .filter((p) => p.id !== post.id && p.id !== newer?.id && p.id !== older?.id)
    .filter((p) => !tourSlug || postTourSlug(p) === tourSlug)
    .slice(0, 3);

  return (
    <article className="break-keep py-12 sm:py-16">
      <Container size="text">
        {!post.published && <DraftNotice editHref={`/admin/blog/${post.id}`} />}

        <Link href="/blog" className="text-sm text-white/60 transition-colors hover:text-white">
          ← 오늘의 오키니티
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/65">
            {tourEntry && (
              <Link
                href={`/tours/${tourEntry.slug}`}
                className="rounded-full border border-[#5fc6ef]/40 bg-[#5fc6ef]/10 px-3 py-1 font-semibold text-[#5fc6ef] transition-colors hover:bg-[#5fc6ef]/20"
              >
                {tourEntry.name}
              </Link>
            )}
            {post.date && <span>{formatDate(post.date, locale)}</span>}
            {(photoCount > 0 || videoCount > 0) && (
              <span className="text-white/50">
                · {[photoCount > 0 && `사진 ${photoCount}장`, videoCount > 0 && `영상 ${videoCount}개`].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <h1 className="user-text mt-3 text-balance font-serif text-3xl leading-tight text-white sm:text-4xl">{title}</h1>
        </header>

        <BlogBody groups={groups} title={title} />

        {tourEntry && tourDetail && (
          <section className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e3858]/90 to-[#061522]/90 backdrop-blur-md sm:flex">
            {tourCover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cdnMedia(tourCover)} alt="" loading="lazy" className="h-44 w-full object-cover sm:h-auto sm:w-56" />
            )}
            <div className="flex-1 p-6">
              <p className="text-xs font-bold tracking-[0.2em] text-[#5fc6ef]">이 날의 투어</p>
              <h2 className="mt-2 font-serif text-2xl text-white">{tourEntry.name}</h2>
              {tourDetail.published && tourDetail.summary && (
                <p className="mt-2 text-[15px] leading-relaxed text-white/75">{tourDetail.summary}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/reserve?tour=${tourEntry.slug}`}
                  className="inline-flex h-12 items-center rounded-full bg-amber-400 px-6 text-[15px] font-bold text-[#06202f] transition-colors hover:bg-amber-300"
                >
                  이 투어 예약 문의하기
                </Link>
                <Link
                  href={`/tours/${tourEntry.slug}`}
                  className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-[15px] font-bold text-white transition-colors hover:border-white/50"
                >
                  투어 자세히 보기
                </Link>
              </div>
            </div>
          </section>
        )}

        {(older || newer) && (
          <nav aria-label="다른 글" className="mt-10 grid gap-3 sm:grid-cols-2">
            {older ? <PostCard post={older} label="← 이전 기록" /> : <span className="hidden sm:block" />}
            {newer && <PostCard post={newer} label="다음 기록 →" />}
          </nav>
        )}

        {others.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold text-white/70">
              {tourEntry ? `${tourEntry.name} 다른 기록` : '다른 기록'}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {others.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </article>
  );
}
