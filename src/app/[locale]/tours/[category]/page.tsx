import { notFound } from 'next/navigation';
import { getCategoryBySlug, tourCategories } from '@/lib/tours';
import { CategoryDetail } from '@/components/category-detail';

type Props = {
  params: Promise<{ locale: string; category: string }>;
};

export function generateStaticParams() {
  return tourCategories.map((cat) => ({ category: cat.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return <CategoryDetail category={category} />;
}
