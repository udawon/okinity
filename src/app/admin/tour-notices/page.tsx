import {
  getSiteContent,
  getSiteContentMap,
  CONTENT_KEYS,
  localizedContentKey,
  isContentLocale
} from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { TOUR_CATALOG, resolveTourDetail } from '@/lib/tour';
import { TOUR_NOTICE_IDS, parseTourNotices, type TourNoticeId } from '@/lib/tour-notices';
import AdminShell from '@/components/admin/AdminShell';
import LangTabs from '@/components/admin/LangTabs';
import TourNoticesForm from '@/components/admin/TourNoticesForm';
import AutoTranslateNote from '@/components/admin/AutoTranslateNote';

export const dynamic = 'force-dynamic';
// 한국어 저장 시 EN/JA 자동 번역 — 번역 대기 시간 확보
export const maxDuration = 60;

export default async function AdminTourNoticesPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await searchParams;
  const lang = isContentLocale(rawLang) ? rawLang : 'ko';
  const enabled = isSupabaseEnabled();

  // 그 언어 키만 읽는다(한국어로 폴백하지 않음) — 비어 있으면 그 언어의 기본 문구.
  const notices = parseTourNotices(
    enabled ? await getSiteContent(localizedContentKey(CONTENT_KEYS.tourNotices, lang)) : null,
    lang
  );

  // 어떤 투어가 켜 두었는지(켜기는 언어 공통 — 한국어 투어 상세 값)
  const map = enabled ? await getSiteContentMap(TOUR_CATALOG.map((t) => CONTENT_KEYS.tour(t.slug))) : {};
  const usage = Object.fromEntries(TOUR_NOTICE_IDS.map((id) => [id, [] as string[]])) as Record<TourNoticeId, string[]>;
  for (const t of TOUR_CATALOG) {
    const d = resolveTourDetail(t.slug, map[CONTENT_KEYS.tour(t.slug)] ?? null);
    for (const id of TOUR_NOTICE_IDS) if (d.notices.includes(id)) usage[id].push(t.name);
  }

  return (
    <AdminShell title="공통 안내" actions={<LangTabs basePath="/admin/tour-notices" current={lang} />}>
      <div className="rounded-card border border-line bg-surface p-4 text-sm leading-relaxed text-ink">
        <p>
          환불·안전 규정을 <b>한 곳에서</b> 고치면, 이 안내를 켠 모든 투어 페이지에 한 번에 반영돼요. 투어마다 켜고 끄기는{' '}
          <b>투어 상세 → 공통 안내 붙이기</b>에서 합니다.
        </p>
        <p className="mt-2 text-muted">
          켜면 그 투어 본문에 있던 같은 주제의 ★제목★ 섹션(예: ★환불 규정★)은 겹치지 않게 숨겨져요.
          {lang !== 'ko' && ' 이 언어는 저장하지 않으면 아래 기본 번역문이 보여요 — 기존 영어·일본어 본문에는 환불 규정이 없어서 새로 번역한 문구이니, 켜기 전에 꼭 확인해 주세요.'}
        </p>
      </div>
      <AutoTranslateNote lang={lang} className="mt-3" />
      <div className="mt-5">
        <TourNoticesForm key={lang} initial={notices} usage={usage} lang={lang} disabled={!enabled} />
      </div>
    </AdminShell>
  );
}
