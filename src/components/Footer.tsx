import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

/** 이메일 글리프 */
function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 카카오톡 말풍선 글리프 */
function KakaoGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 3C6.477 3 2 6.463 2 10.74c0 2.74 1.83 5.146 4.6 6.51-.2.69-.72 2.48-.83 2.87-.13.48.18.47.37.34.15-.1 2.4-1.62 3.37-2.28.68.1 1.38.15 2.09.15 5.523 0 10-3.463 10-7.74S17.523 3 12 3z" />
    </svg>
  );
}

/** LINE 말풍선 글리프 */
function LineGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 3.5c-5.24 0-9.5 3.46-9.5 7.72 0 3.82 3.38 7.02 7.94 7.63.31.07.73.2.84.47.1.24.06.62.03.86l-.13.8c-.04.24-.19.94.83.51 1.02-.43 5.49-3.23 7.49-5.53C20.55 14.46 21 12.86 21 11.22 21 6.96 16.74 3.5 12 3.5z" />
    </svg>
  );
}

/** 외부 링크 화살표(↗) */
function ArrowGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 text-white/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#5fc6ef]"
      aria-hidden
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

const rowCls =
  'group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/75 backdrop-blur-sm transition-colors duration-200 hover:border-[#5fc6ef]/45 hover:bg-white/[0.07] hover:text-white sm:w-60';
const chipCls = 'grid h-8 w-8 shrink-0 place-items-center rounded-full';

/** 푸터 문의 링크 한 줄 — 글래스 버튼 + 저채도 브랜드 틴트 아이콘. */
function ContactRow({
  href,
  label,
  tint,
  external,
  children
}: {
  href: string;
  label: string;
  tint: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={rowCls}
    >
      <span className={`${chipCls} ${tint}`}>{children}</span>
      <span className="flex-1 text-left font-medium">{label}</span>
      <ArrowGlyph />
    </a>
  );
}

export default async function Footer() {
  const t = await getTranslations('footer');
  const telHref = `tel:${site.phone.replace(/[^+\d]/g, '')}`;

  return (
    <footer className="mt-20 border-t border-white/10 bg-black/25 backdrop-blur-sm">
      <Container className="flex flex-col gap-10 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Image
            src="/brand/logo-white.png"
            alt={site.name}
            width={819}
            height={235}
            className="h-10 w-auto sm:h-11"
          />
          <address className="mt-5 text-sm not-italic leading-relaxed text-white/55">
            {site.address.postal}
            <br />
            {site.address.line}
            <br />
            <a href={telHref} className="transition-colors hover:text-white">
              {site.phone}
            </a>
            <br />
            {site.address.representative}
          </address>
          <p className="mt-5 text-xs text-white/40">
            {t('rights', { year: new Date().getFullYear() })}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">Contact</p>
          <div className="mt-4 flex flex-col gap-2.5 sm:items-end">
            <ContactRow
              href={`mailto:${site.contact.email}`}
              label={t('email')}
              tint="bg-[#5fc6ef]/15 text-[#7dd3f5]"
            >
              <MailGlyph />
            </ContactRow>
            {site.contact.kakaoChannel && (
              <ContactRow
                href={site.contact.kakaoChannel}
                label={t('kakao')}
                tint="bg-[#FEE500]/15 text-[#FEE500]"
                external
              >
                <KakaoGlyph />
              </ContactRow>
            )}
            {site.contact.line && (
              <ContactRow
                href={site.contact.line}
                label={t('line')}
                tint="bg-[#06C755]/20 text-[#3fe09a]"
                external
              >
                <LineGlyph />
              </ContactRow>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
