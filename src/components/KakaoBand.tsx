import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { site } from '@/config/site.config';
import Container from './Container';

/**
 * 카카오톡 실시간 문의 밴드 (hongstardive의 노란 띠와 같은 역할).
 * 디자인은 우리 테마(차콜 밴드 + 앰버 외곽선 버튼) — DESIGN.md가 밝은 색 금지라 노란색 미사용.
 * kakaoOpenChat 링크가 없으면 예약 폼(/contact)으로 폴백.
 */
export default async function KakaoBand() {
  const t = await getTranslations('kakao');
  const href = site.contact.kakaoOpenChat || '/contact';
  const external = href.startsWith('http');

  const button = (
    <span className="inline-block rounded-button border border-brand-contrast/80 px-7 py-3 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-contrast hover:text-brand-dark">
      {t('button')}
    </span>
  );

  return (
    <section className="bg-brand">
      <Container className="flex flex-col items-center gap-4 py-16 text-center">
        <h2 className="font-serif text-3xl text-brand-contrast">
          {t('title')}
        </h2>
        <p className="text-sm text-brand-contrast/85">{t('subtitle')}</p>
        <div className="mt-2">
          {external ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {button}
            </a>
          ) : (
            <Link href={href}>{button}</Link>
          )}
        </div>
      </Container>
    </section>
  );
}
