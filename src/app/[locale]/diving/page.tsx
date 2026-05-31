import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import TourCategoryDetail, { getActivity } from '@/components/TourCategoryDetail';

// 어드민 투어 카테고리 이미지(home_tours) 즉시 반영
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('diving') };
}

export default async function DivingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activity = getActivity('diving');
  if (!activity) notFound();

  const overrides = await getSiteContentMap();
  const image = (overrides[CONTENT_KEYS.homeTours]?.images as Record<string, string> | undefined)?.[
    activity.id
  ];

  return <TourCategoryDetail activity={activity} image={image} />;
}
