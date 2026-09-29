import {
  getSiteContent,
  CONTENT_KEYS,
  localizedContentKey,
  isContentLocale
} from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseAbout, resolveAbout } from '@/lib/about';
import AdminShell from '@/components/admin/AdminShell';
import AboutEditor from '@/components/admin/AboutEditor';
import LangTabs from '@/components/admin/LangTabs';
import AutoTranslateNote from '@/components/admin/AutoTranslateNote';

export const dynamic = 'force-dynamic';
// 한국어 저장 시 EN/JA 자동 번역 — 번역 대기 시간 확보
export const maxDuration = 60;

export default async function AdminAboutPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await searchParams;
  const lang = isContentLocale(rawLang) ? rawLang : 'ko';
  const enabled = isSupabaseEnabled();
  // 편집 대상 언어의 저장값. en/ja가 아직 없으면 한국어 값을 번역 초안으로 프리필.
  const value = enabled
    ? await getSiteContent(localizedContentKey(CONTENT_KEYS.about, lang))
    : null;
  const fallback =
    value == null && lang !== 'ko' && enabled ? await getSiteContent(CONTENT_KEYS.about) : null;
  const about = resolveAbout(parseAbout(value ?? fallback));

  return (
    <AdminShell title="소개 페이지">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          저장한 내용은 <code>/about</code> 페이지에 표시됩니다. 비운 항목은 기본 문구로 대체됩니다.
        </p>
        <LangTabs basePath="/admin/about" current={lang} />
      </div>
      <AutoTranslateNote lang={lang} className="mb-4" />

      <AboutEditor key={lang} defaults={about} lang={lang} disabled={!enabled} />
    </AdminShell>
  );
}
