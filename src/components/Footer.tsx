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

const linkCls =
  'group inline-flex items-center gap-2.5 text-sm text-white/65 transition-colors duration-200 hover:text-white';

/** 푸터 문의 링크 — 박스 없는 심플 목록(아이콘 + 라벨). */
function ContactLink({
  href,
  label,
  iconColor,
  external,
  children
}: {
  href: string;
  label: string;
  iconColor: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={linkCls}>
      <span className={`shrink-0 ${iconColor}`}>{children}</span>
      <span>{label}</span>
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

        {/* PC에서 CONTACT 상단을 주소(〒) 상단과 맞춤: 로고 높이(h-11=44) + 간격(mt-5=20) = 64px 내림 */}
        <div className="sm:mt-16 sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">Contact</p>
          <div className="mt-4 flex flex-col gap-3 sm:items-end">
            <ContactLink
              href={`mailto:${site.contact.email}`}
              label={t('email')}
              iconColor="text-[#7dd3f5]"
            >
              <MailGlyph />
            </ContactLink>
            {site.contact.kakaoChannel && (
              <ContactLink
                href={site.contact.kakaoChannel}
                label={t('kakao')}
                iconColor="text-[#FEE500]"
                external
              >
                <KakaoGlyph />
              </ContactLink>
            )}
            {site.contact.line && (
              <ContactLink
                href={site.contact.line}
                label={t('line')}
                iconColor="text-[#3fe09a]"
                external
              >
                <LineGlyph />
              </ContactLink>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
