import { redirect } from 'next/navigation';

// 예약 진입점을 /reserve(캘린더+폼)로 일원화. 기존 링크 호환을 위해 리다이렉트.
export default async function ContactRedirect({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/reserve`);
}
