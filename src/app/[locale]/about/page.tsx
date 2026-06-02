import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseAbout, resolveAbout, splitList } from '@/lib/about';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return { title: '소개' };
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const about = resolveAbout(parseAbout(await getSiteContent(CONTENT_KEYS.about)));
  const titleLines = about.title.split('\n');
  const bodyParas = about.body.split('\n').filter((p) => p.trim());
  const certs = splitList(about.instructorCerts);

  return (
    <section className="py-14 sm:py-20">
      <Container className="max-w-3xl [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
        {/* 상단 소개 */}
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
          {about.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">
          {titleLines.map((line, i) => {
            const accent = titleLines.length > 1 && i === titleLines.length - 1;
            return (
              <span key={i} className={i === 0 ? 'block' : 'mt-1 block'}>
                {accent ? <span className="text-ocean">{line}</span> : line}
              </span>
            );
          })}
        </h1>
        {about.intro && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{about.intro}</p>
        )}

        {about.heroImage && (
          <div className="mt-8 overflow-hidden rounded-card border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={about.heroImage}
              alt={about.instructorName || '소개 이미지'}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        {bodyParas.length > 0 && (
          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-white/80">
            {bodyParas.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* 핵심 강점 */}
        {about.strengths.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {about.strengths.map((s, i) => (
              <div
                key={i}
                className="rounded-card border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_36px_-18px_rgba(0,0,0,0.5)]"
              >
                <h3 className="font-serif text-lg text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* 대표 강사 */}
        {(about.instructorName || about.instructorBody) && (
          <div className="mt-14 border-t border-white/10 pt-10">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-8">
              {about.instructorPhoto && (
                <div
                  className="aspect-square w-48 shrink-0 overflow-hidden rounded-card border border-white/10 bg-cover bg-center shadow-[0_18px_40px_-20px_rgba(0,0,0,0.65)] sm:w-72"
                  style={{ backgroundImage: `url(${about.instructorPhoto})` }}
                  role="img"
                  aria-label={about.instructorName}
                />
              )}
              <div className="min-w-0 flex-1">
                {about.instructorName && (
                  <p className="font-serif text-2xl text-white sm:text-3xl">
                    {about.instructorName}
                  </p>
                )}
                {about.instructorRole && (
                  <p className="mt-1.5 text-sm font-medium text-cyan-200/80">
                    {about.instructorRole}
                  </p>
                )}
                {certs.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {certs.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
                {about.instructorBody && (
                  <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
                    {about.instructorBody}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
