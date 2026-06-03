import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** 일정표는 예약 허브(/reserve)로 통합됨 — 기존 링크·북마크 호환용 리다이렉트. */
export default async function SchedulePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/reserve`);
}
