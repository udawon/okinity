import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

/**
 * 앱 아이콘 타일 — 채널 브랜드색 스퀘어클(라운드 스퀘어) 위에 글리프를 얹어 '실제 앱 아이콘'처럼 보이게 한다.
 * 컨테이너(칩) 없이 아이콘을 오른쪽 세로 라인으로 정렬해 통일감을 만든다.
 */
function AppTile({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] shadow-[0_2px_6px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-black/10 transition-transform duration-200 group-hover:scale-105 ${bg}`}
    >
      {children}
    </span>
  );
}

/** 이메일 앱 아이콘 — 브랜드 스카이블루 타일 + 흰색 봉투. */
function MailTile() {
  return (
    <AppTile bg="bg-gradient-to-br from-[#5fc6ef] to-[#2f9fd4]">
      <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" className="h-[13px] w-[13px]">
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path d="m3.5 8 8.5 5.5 8.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </AppTile>
  );
}

/** 카카오톡 앱 아이콘 — 카카오 옐로 타일 + 브라운 말풍선. */
function KakaoTile() {
  return (
    <AppTile bg="bg-[#FEE500]">
      <svg viewBox="0 0 24 24" fill="#3C1E1E" className="h-[13px] w-[13px]">
        <path d="M12 4.3C6.9 4.3 2.75 7.5 2.75 11.46c0 2.54 1.7 4.77 4.27 6.03-.19.64-.67 2.3-.77 2.66-.12.45.17.44.35.32.14-.09 2.23-1.5 3.13-2.11.74.11 1.5.16 2.27.16 5.1 0 9.25-3.2 9.25-7.16S17.1 4.3 12 4.3z" />
      </svg>
    </AppTile>
  );
}

/** LINE 앱 아이콘 — LINE 그린 타일 + 흰색 말풍선. */
function LineTile() {
  return (
    <AppTile bg="bg-[#06C755]">
      <svg viewBox="0 0 24 24" fill="#ffffff" className="h-[14px] w-[14px]">
        <path d="M12 4.2C6.76 4.2 2.5 7.66 2.5 11.92c0 3.82 3.38 7.02 7.94 7.63.31.07.73.2.84.47.1.24.06.62.03.86l-.13.8c-.04.24-.19.94.83.51 1.02-.43 5.49-3.23 7.49-5.53 1.38-1.51 2-3.05 2-4.74C21.5 7.66 17.24 4.2 12 4.2z" />
      </svg>
    </AppTile>
  );
}

/**
 * 푸터 문의 행 — 컨테이너 없이 [라벨][앱 아이콘] 순서. 우측 정렬 컬럼에서 아이콘이 오른쪽 세로 라인으로
 * 정렬돼 통일감을 만든다(라벨 길이와 무관하게 아이콘 열이 가지런함). 카카오톡·라인은 실제 앱 아이콘으로 식별.
 */
function ContactRow({
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
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group inline-flex items-center gap-2.5 text-[13px] font-medium text-white/70 transition-colors duration-200 hover:text-white"
    >
      <span>{label}</span>
      {children}
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

        {/* 컨테이너 없이 아이콘을 오른쪽 세로 라인으로 정렬해 통일감. 작은 '문의' 헤딩으로 그룹을 묶는다.
            PC에서 첫 행(이메일)을 왼쪽 주소(〒) 높이와 맞춤 — 헤딩(~15px)+간격(14px)만큼 빼서 내림. */}
        <div className="flex flex-col items-start gap-3.5 sm:mt-9 sm:items-end">
            <p className="text-[10px] font-semibold tracking-[0.08em] text-white/40">
              {t('contactUs')}
            </p>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <ContactRow href={`mailto:${site.contact.email}`} label={t('email')}>
                <MailTile />
              </ContactRow>
              {site.contact.kakaoChannel && (
                <ContactRow href={site.contact.kakaoChannel} label={t('kakao')} external>
                  <KakaoTile />
                </ContactRow>
              )}
              {site.contact.line && (
                <ContactRow href={site.contact.line} label={t('line')} external>
                  <LineTile />
                </ContactRow>
              )}
            </div>
        </div>
      </Container>
    </footer>
  );
}
