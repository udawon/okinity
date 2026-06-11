import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

/**
 * 앱 아이콘 타일 — 채널 색의 라운드 스퀘어 위에 글리프를 얹어 '실제 앱 아이콘'처럼 보이게 한다.
 * tileCls 로 배경(브랜드 색/그라데이션)을, 내부 svg 로 글리프(흰색/대비색)를 지정.
 */
function AppIconTile({ tileCls, children }: { tileCls: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] shadow-[0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/15 transition-transform duration-200 group-hover:-translate-y-0.5 ${tileCls}`}
    >
      {children}
    </span>
  );
}

/** 이메일 앱 아이콘 — 브랜드 스카이블루 타일 + 흰색 봉투. */
function MailIcon() {
  return (
    <AppIconTile tileCls="bg-gradient-to-br from-[#5fc6ef] to-[#2f9fd4]">
      <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" className="h-[18px] w-[18px]">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m3.5 7.5 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </AppIconTile>
  );
}

/** 카카오톡 앱 아이콘 — 카카오 옐로 타일 + 브라운 말풍선. */
function KakaoIcon() {
  return (
    <AppIconTile tileCls="bg-[#FEE500]">
      <svg viewBox="0 0 24 24" fill="#3C1E1E" className="h-[17px] w-[17px]">
        <path d="M12 4C6.9 4 2.75 7.2 2.75 11.16c0 2.54 1.7 4.77 4.27 6.03-.19.64-.67 2.3-.77 2.66-.12.45.17.44.35.32.14-.09 2.23-1.5 3.13-2.11.74.11 1.5.16 2.27.16 5.1 0 9.25-3.2 9.25-7.16S17.1 4 12 4z" />
      </svg>
    </AppIconTile>
  );
}

/** LINE 앱 아이콘 — LINE 그린 타일 + 흰색 말풍선. */
function LineIcon() {
  return (
    <AppIconTile tileCls="bg-[#06C755]">
      <svg viewBox="0 0 24 24" fill="#ffffff" className="h-[18px] w-[18px]">
        <path d="M12 4C6.76 4 2.5 7.46 2.5 11.72c0 3.82 3.38 7.02 7.94 7.63.31.07.73.2.84.47.1.24.06.62.03.86l-.13.8c-.04.24-.19.94.83.51 1.02-.43 5.49-3.23 7.49-5.53 1.38-1.51 2.0-3.05 2.0-4.74C21.5 7.46 17.24 4 12 4z" />
      </svg>
    </AppIconTile>
  );
}

const linkCls =
  'group inline-flex items-center gap-3 text-sm text-white/70 transition-colors duration-200 hover:text-white';

/** 푸터 문의 링크 — 앱 아이콘 타일 + 라벨. */
function ContactLink({
  href,
  label,
  external,
  children
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={linkCls}>
      {children}
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

        {/* PC에서 첫 링크(이메일) 상단을 주소(〒) 상단과 맞춤: 로고 높이(h-11=44) + 간격(mt-5=20) = 64px 내림 */}
        <div className="flex flex-col gap-3.5 sm:mt-16 sm:items-end">
            <ContactLink href={`mailto:${site.contact.email}`} label={t('email')}>
              <MailIcon />
            </ContactLink>
            {site.contact.kakaoChannel && (
              <ContactLink href={site.contact.kakaoChannel} label={t('kakao')} external>
                <KakaoIcon />
              </ContactLink>
            )}
            {site.contact.line && (
              <ContactLink href={site.contact.line} label={t('line')} external>
                <LineIcon />
              </ContactLink>
            )}
        </div>
      </Container>
    </footer>
  );
}
