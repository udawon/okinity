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
    <span className="inline-block border border-accent px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] text-brand-contrast transition-colors hover:bg-accent hover:text-ink">
      {t('button')}
    </span>
  );

  return (
    <section className="bg-brand">
      <Container className="flex flex-col items-center gap-4 py-14 text-center">
        <h2 className="font-serif text-2xl text-brand-contrast sm:text-3xl">
          {t('title')}
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-brand-contrast/80">
          {t('subtitle')}
        </p>
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
