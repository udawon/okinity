import { Link } from '@/i18n/routing';

/** 카테고리 카드 — 사진 위 제목 오버레이 (리조트 톤). 둥근 모서리 + 부드러운 그림자. */
export default function CategoryCard({
  title,
  description,
  href,
  image = '/images/placeholder.svg'
}: {
  title: string;
  description: string;
  href: string;
  image?: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <div className="relative aspect-[3/4] h-full overflow-hidden rounded-card shadow-card transition-shadow duration-300 group-hover:shadow-hover">
        <div
          className="absolute inset-0 bg-brand-light bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${image})` }}
          role="img"
          aria-label={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-7 text-white">
          <h3 className="font-serif text-4xl leading-tight">{title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-white/85">{description}</p>
          <span className="mt-4 inline-block text-sm font-medium text-white/90">
            자세히 →
          </span>
        </div>
      </div>
    </Link>
  );
}
