import { Link } from '@/i18n/routing';

/**
 * 시그니처 카드 — 세로로 긴 비디오형 박스(비율 9:16, 레퍼런스 측정값 340×604 ≈ 0.563).
 * 제목은 상단 중앙 소형 대문자, 가운데 재생 버튼.
 * video가 주어지면 자동재생 영상, 없으면 이미지/그라데이션.
 */
export default function CategoryCard({
  title,
  description,
  href,
  image = '/images/placeholder.svg',
  video
}: {
  title: string;
  description: string;
  href: string;
  image?: string;
  video?: string;
}) {
  return (
    <Link href={href} className="group block h-full" aria-label={description}>
      <div className="relative aspect-[9/16] h-full overflow-hidden">
        {video ? (
          <video
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            autoPlay
            muted
            loop
            playsInline
            poster={image}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 bg-brand-light bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${image})` }}
            role="img"
            aria-label={title}
          />
        )}
        <div className="absolute inset-0 bg-ink/35 transition-colors group-hover:bg-ink/25" />

        {/* 제목: 상단 중앙 소형 대문자 */}
        <div className="absolute inset-x-0 top-0 flex justify-center px-5 pt-8 text-center">
          <h3 className="font-serif text-lg uppercase leading-snug tracking-[0.18em] text-white sm:text-xl">
            {title}
          </h3>
        </div>

        {/* 재생 버튼: 중앙 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 transition-colors group-hover:bg-white/15">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
