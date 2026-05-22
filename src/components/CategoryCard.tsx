import { Link } from '@/i18n/routing';

/** 홈 카테고리 카드 — 주요 섹션(다이빙/PADI/일정표/갤러리)으로 가는 진입 카드. */
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
    <Link
      href={href}
      className="group flex flex-col border border-line bg-surface transition-colors hover:border-brand"
    >
      <div
        className="aspect-[4/3] w-full bg-brand-light bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label={title}
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-serif text-xl text-ink group-hover:text-brand-dark">
          {title}
        </h3>
        <p className="font-mono text-xs leading-relaxed tracking-[0.02em] text-muted">
          {description}
        </p>
      </div>
    </Link>
  );
}
