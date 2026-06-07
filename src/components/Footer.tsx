import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

/** 이메일 글리프 */
function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 카카오톡 말풍선 글리프 */
function KakaoGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M12 3C6.477 3 2 6.463 2 10.74c0 2.74 1.83 5.146 4.6 6.51-.2.69-.72 2.48-.83 2.87-.13.48.18.47.37.34.15-.1 2.4-1.62 3.37-2.28.68.1 1.38.15 2.09.15 5.523 0 10-3.463 10-7.74S17.523 3 12 3z" />
    </svg>
  );
}

/** LINE 말풍선 글리프 */
function LineGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M12 3C6.5 3 2 6.69 2 11.2c0 4.04 3.57 7.43 8.4 8.09.33.07.77.22.88.5.1.25.07.64.03.9 0 0-.12.71-.14.86-.04.25-.2 1 .88.54 1.08-.45 5.8-3.42 7.92-5.85C21.49 14.78 22 13.06 22 11.2 22 6.69 17.5 3 12 3zM8.2 13.6h-1.9c-.18 0-.33-.15-.33-.33V9.46c0-.18.15-.33.33-.33.18 0 .33.15.33.33v3.48H8.2c.18 0 .33.15.33.33s-.15.33-.33.33zm1.3-.33c0 .18-.15.33-.33.33s-.33-.15-.33-.33V9.46c0-.18.15-.33.33-.33s.33.15.33.33v3.81zm4.34 0c0 .14-.09.27-.23.31a.33.33 0 0 1-.36-.12l-1.95-2.65v2.46c0 .18-.15.33-.33.33s-.33-.15-.33-.33V9.46c0-.14.09-.27.23-.31a.33.33 0 0 1 .36.12l1.95 2.65V9.46c0-.18.15-.33.33-.33s.33.15.33.33v3.81zm2.83-2.24c.18 0 .33.15.33.33s-.15.33-.33.33h-1.24v.92h1.24c.18 0 .33.15.33.33s-.15.33-.33.33h-1.57a.33.33 0 0 1-.33-.33V9.46c0-.18.15-.33.33-.33h1.57c.18 0 .33.15.33.33s-.15.33-.33.33h-1.24v.92h1.24z" />
    </svg>
  );
}

const contactCls =
  'group inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-white/75 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white';
const chipCls = 'grid h-6 w-6 shrink-0 place-items-center rounded-full';

export default async function Footer() {
  const t = await getTranslations('footer');
  const telHref = `tel:${site.phone.replace(/[^+\d]/g, '')}`;

  return (
    <footer className="mt-20 border-t border-white/10 bg-black/25 backdrop-blur-sm">
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Image
            src="/brand/logo-white.png"
            alt={site.name}
            width={819}
            height={235}
            className="h-10 w-auto sm:h-11"
          />
          <address className="mt-4 text-sm not-italic leading-relaxed text-white/55">
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
          <p className="mt-4 text-xs text-white/45">
            {t('rights', { year: new Date().getFullYear() })}
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-sm font-semibold text-white">{t('contactUs')}</span>
          <div className="mt-3 flex flex-col items-start gap-2 sm:items-end">
            <a href={`mailto:${site.contact.email}`} className={contactCls}>
              <span className={`${chipCls} bg-white/10 text-white`}>
                <MailGlyph />
              </span>
              {t('email')}
            </a>
            {site.contact.kakaoChannel && (
              <a
                href={site.contact.kakaoChannel}
                target="_blank"
                rel="noopener noreferrer"
                className={contactCls}
              >
                <span className={`${chipCls} bg-[#FEE500] text-[#3C1E1E]`}>
                  <KakaoGlyph />
                </span>
                {t('kakao')}
              </a>
            )}
            {site.contact.line && (
              <a
                href={site.contact.line}
                target="_blank"
                rel="noopener noreferrer"
                className={contactCls}
              >
                <span className={`${chipCls} bg-[#06C755] text-white`}>
                  <LineGlyph />
                </span>
                {t('line')}
              </a>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
