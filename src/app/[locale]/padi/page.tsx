import { redirect } from 'next/navigation';

// 카테고리 허브 폐지 — 대표 투어로 통일. 기존 링크 호환을 위해 리다이렉트.
export default async function PadiRedirect({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/tours/ow-course`);
}
