import { redirect } from 'next/navigation';

// 상품 목록은 다이빙/PADI로 분리됨. 기존 /products 진입은 /diving 으로.
export default async function ProductsRedirect({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/diving`);
}
