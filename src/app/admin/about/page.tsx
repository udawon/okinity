import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseAbout, resolveAbout } from '@/lib/about';
import AdminShell from '@/components/admin/AdminShell';
import AboutEditor from '@/components/admin/AboutEditor';

export const dynamic = 'force-dynamic';

export default async function AdminAboutPage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.about) : null;
  const about = resolveAbout(parseAbout(value));

  return (
    <AdminShell title="소개 페이지">
      <p className="mb-6 text-sm text-muted">
        저장한 내용은 <code>/about</code> 페이지에 표시됩니다. 비운 항목은 기본 문구로 대체됩니다.
      </p>

      <AboutEditor defaults={about} disabled={!enabled} />
    </AdminShell>
  );
}
