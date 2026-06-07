import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Container from '@/components/Container';

export default async function NotFound() {
  const t = await getTranslations('nav');
  return (
    <Container className="py-24 text-center [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
      <h1 className="text-5xl font-extrabold text-white">404</h1>
      <p className="mt-4 text-white/70">페이지를 찾을 수 없습니다 / Page not found / ページが見つかりません</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-button bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
      >
        {t('home')}
      </Link>
    </Container>
  );
}
