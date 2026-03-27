import { notFound } from 'next/navigation';
import { getTourBySlug, tourCategories } from '@/lib/tours';
import { TourDetail } from '@/components/tour-detail';
import { routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string; category: string; slug: string }>;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    tourCategories.flatMap((cat) =>
      cat.tours.map((tour) => ({
        locale,
        category: cat.slug,
        slug: tour.slug,
      }))
    )
  );
}

export default async function TourPage({ params }: Props) {
  const { category, slug } = await params;
  const tour = getTourBySlug(category, slug);

  if (!tour) {
    notFound();
  }

  return <TourDetail tour={tour} />;
}
