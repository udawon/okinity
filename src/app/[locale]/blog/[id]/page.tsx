import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseBlogItems } from '@/lib/blog';
import Container from '@/components/Container';

export const dynamic = 'force-dynamic';

function formatDate(date: string, locale: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

async function loadPost(id: string) {
  const value = await getSiteContent(CONTENT_KEYS.blog);
  return parseBlogItems(value?.items).find((p) => p.id === id && p.published) ?? null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id);
  return { title: post?.title || '블로그' };
}

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const post = await loadPost(id);
  if (!post) notFound();

  return (
    <article className="py-16 sm:py-24">
      <Container className="max-w-2xl">
        <Link href="/blog" className="text-sm text-white/55 transition-colors hover:text-white">
          ← 오늘의 오키니티
        </Link>

        <header className="mt-6">
          {post.date && (
            <p className="text-sm tracking-wide text-[#5fd6e2]">{formatDate(post.date, locale)}</p>
          )}
          <h1 className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl">
            {post.title || '(제목 없음)'}
          </h1>
        </header>

        <div className="mt-10 space-y-6">
          {post.blocks.map((b, i) =>
            b.type === 'text' ? (
              <p key={i} className="whitespace-pre-wrap text-base leading-relaxed text-white/85">
                {b.value}
              </p>
            ) : b.url ? (
              <figure key={i} className="overflow-hidden rounded-card border border-white/10">
                {/* 원격(Supabase) 이미지 — next/image 도메인 설정 회피 위해 img 사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.url} alt={b.caption || ''} className="w-full" />
                {b.caption && (
                  <figcaption className="bg-black/20 px-4 py-2 text-center text-sm text-white/55">
                    {b.caption}
                  </figcaption>
                )}
              </figure>
            ) : null
          )}
        </div>
      </Container>
    </article>
  );
}
