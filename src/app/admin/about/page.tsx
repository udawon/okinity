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

export const dynamic = 'force-dynamic';

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
      {lang !== 'ko' && (
        <p className="mb-4 rounded-card border border-line bg-bg/40 p-3 text-xs text-muted">
          {lang === 'en' ? 'English' : '日本語'} 버전을 편집 중입니다. 이 언어로 저장하지 않으면
          방문자에게 한국어가 폴백으로 보입니다.
        </p>
      )}

      <AboutEditor key={lang} defaults={about} lang={lang} disabled={!enabled} />
    </AdminShell>
  );
}
