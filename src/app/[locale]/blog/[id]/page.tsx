import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseBlogItems, excerptOf } from '@/lib/blog';
import { localeAlternates } from '@/lib/seo';
import { isAdminPreview } from '@/lib/admin-preview';
import Container from '@/components/Container';
import MediaFigure from '@/components/MediaFigure';
import DraftNotice from '@/components/DraftNotice';

export const dynamic = 'force-dynamic';

function formatDate(date: string, locale: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

/**
 * 초안(비공개)은 어드민 로그인 상태에서만 열린다 — 공개 전 미리보기용.
 * 그 외에는 지금까지와 동일하게 없는 글로 취급한다.
 */
async function loadPost(id: string) {
  const value = await getSiteContent(CONTENT_KEYS.blog);
  const post = parseBlogItems(value?.items).find((p) => p.id === id) ?? null;
  if (!post) return null;
  if (post.published) return post;
  return (await isAdminPreview()) ? post : null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const post = await loadPost(id);
  return {
    title: post?.title || '블로그',
    description: post ? excerptOf(post) : undefined,
    // 초안은 어드민에게만 보이지만, 색인 대상이 아님을 명시해 둔다.
    ...(post && !post.published ? { robots: { index: false, follow: false } } : {}),
    alternates: localeAlternates(locale, `/blog/${id}`)
  };
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

  const post = await loadPost(id);
  if (!post) notFound();

  return (
    <article className="py-16 sm:py-24">
      <Container className="max-w-2xl">
        {!post.published && <DraftNotice editHref={`/admin/blog/${post.id}`} />}

        <Link href="/blog" className="text-sm text-white/55 transition-colors hover:text-white">
          ← 오늘의 오키니티
        </Link>

        <header className="mt-6">
          {post.date && (
            <p className="text-sm tracking-wide text-[#5fc6ef]">{formatDate(post.date, locale)}</p>
          )}
          <h1 className="mt-2 text-balance font-serif text-3xl leading-tight text-white sm:text-4xl">
            {post.title || '(제목 없음)'}
          </h1>
        </header>

        <div className="mt-10 space-y-6">
          {post.blocks.map((b, i) =>
            b.type === 'text' ? (
              <p key={i} className="whitespace-pre-wrap text-base leading-relaxed text-white/85">
                {b.value}
              </p>
            ) : (
              <MediaFigure
                key={i}
                type={b.type}
                url={b.url}
                poster={b.type === 'video' ? b.poster : undefined}
                caption={b.caption}
              />
            )
          )}
        </div>
      </Container>
    </article>
  );
}
