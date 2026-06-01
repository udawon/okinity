import { Link } from '@/i18n/routing';
import Container from './Container';
import { ACTIVITIES, type Activity } from './ocean-home-data';

/** 카테고리 id 로 활동 데이터 조회 (없으면 undefined). */
export function getActivity(id: Activity['id']): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

/**
 * 투어 카테고리 상세 페이지 본문 — /diving, /padi 공용.
 * 새 투어 데이터(ocean-home-data)를 사용. 다크 레이아웃 위에 흰 글씨.
 * 이미지는 어드민 투어 카테고리 이미지(home_tours)로 교체 가능.
 */
export default function TourCategoryDetail({
  activity,
  image
}: {
  activity: Activity;
  image?: string;
}) {
  const img = image?.trim() || activity.image;
  return (
    <section className="py-14 sm:py-20">
      <Container className="[text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="overflow-hidden rounded-card border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={activity.title} className="aspect-[4/3] w-full object-cover" />
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.28em]"
              style={{ color: activity.accent }}
            >
              {activity.kicker}
            </p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">{activity.title}</h1>
            <p className="mt-2 text-lg font-medium text-white/75">{activity.tagline}</p>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70">
              {activity.desc}
            </p>

            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5">
              {activity.meta.map((m) => (
                <div key={m.label}>
                  <div className="text-[11px] uppercase tracking-wider text-white/55">{m.label}</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums text-white">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하위 투어 */}
        <div className="mt-14">
          <h2 className="font-serif text-2xl text-white sm:text-3xl">투어 구성</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {activity.tours.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/tours/${t.slug}`}
                  className="group flex items-center justify-between rounded-card border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/85 transition-colors hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: activity.accent }}
                    />
                    {t.name}
                  </span>
                  <span className="shrink-0 text-white/45 transition-colors group-hover:text-white">
                    자세히 →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold text-[#06202a] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300"
          >
            예약 · 견적 문의하기
          </Link>
        </div>
      </Container>
    </section>
  );
}
