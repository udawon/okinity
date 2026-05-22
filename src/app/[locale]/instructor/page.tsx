import { redirect } from 'next/navigation';

// 소개 페이지가 /about 으로 통합됨. 기존 링크 호환을 위해 리다이렉트.
export default async function InstructorRedirect({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/about`);
}
