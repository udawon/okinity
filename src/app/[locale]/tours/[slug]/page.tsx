import { notFound } from 'next/navigation';
import { getTourBySlug, tours } from '@/lib/tours';
import { TourDetail } from '@/components/tour-detail';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  return <TourDetail tour={tour} />;
}
