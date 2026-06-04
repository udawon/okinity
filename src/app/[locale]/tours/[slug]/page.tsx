import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Container from '@/components/Container';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { getTourCatalogEntry, parseTourDetail, splitLines } from '@/lib/tour';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getTourCatalogEntry(slug);
  return { title: entry ? `${entry.name} — OKINITY` : 'OKINITY' };
}

export default async function TourDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const entry = getTourCatalogEntry(slug);
  if (!entry) notFound();

  const value = await getSiteContent(CONTENT_KEYS.tour(slug));
  const detail = parseTourDetail(value);
  const showDetail = detail.published;
  const included = splitLines(detail.included);
  const hubHref = entry.categoryId === 'diving' || entry.categoryId === 'padi' ? `/${entry.categoryId}` : '/';

  const meta = [
    detail.duration && { label: '소요', value: detail.duration },
    detail.price && { label: '가격', value: detail.price }
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="py-14 sm:py-20">
      <Container className="max-w-3xl [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
        <Link href={hubHref} className="text-sm text-white/55 transition-colors hover:text-white">
          ← {entry.categoryTitle}
        </Link>

        {showDetail && detail.heroImage && (
          <div className="mt-6 overflow-hidden rounded-card border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.heroImage}
              alt={entry.name}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <header className="mt-7">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: entry.accent }}
          >
            {entry.categoryKicker}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">
            {entry.name}
          </h1>
          {showDetail && detail.summary && (
            <p className="mt-4 text-lg leading-relaxed text-white/80">{detail.summary}</p>
          )}
        </header>

        {showDetail && meta.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5">
            {meta.map((m) => (
              <div key={m.label}>
                <div className="text-[11px] uppercase tracking-wider text-white/55">{m.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-white">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {showDetail && included.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-white">포함 사항</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {included.map((it) => (
                <li key={it} className="flex items-center gap-2 text-sm text-white/80">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.accent }}
                  />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showDetail && detail.body ? (
          <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
            {detail.body}
          </div>
        ) : (
          <p className="mt-8 text-[15px] leading-relaxed text-white/65">
            상세 정보를 준비 중입니다. 일정과 견적은 아래 버튼으로 문의해 주세요. 24시간 안에 한국어로
            안내해 드립니다.
          </p>
        )}

        <div className="mt-10">
          <Link
            href={`/reserve?tour=${slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold text-[#06202a] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300"
          >
            이 투어 예약 문의하기 →
          </Link>
        </div>
      </Container>
    </article>
  );
}
