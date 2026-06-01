import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { parseAbout, resolveAbout } from '@/lib/about';
import AdminNav from '@/components/admin/AdminNav';
import AboutEditor from '@/components/admin/AboutEditor';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminAboutPage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.about) : null;
  const about = resolveAbout(parseAbout(value));

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">소개 페이지</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-button border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            로그아웃
          </button>
        </form>
      </div>

      <div className="mt-4">
        <AdminNav />
      </div>

      {!enabled && (
        <div className="mt-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase가 연결되지 않아 소개 내용을 저장할 수 없습니다.</p>
          <p className="mt-1">
            <code>.env.local</code> 에 SUPABASE 환경변수를 설정하세요.
          </p>
        </div>
      )}

      <p className="mb-6 mt-6 text-sm text-muted">
        저장한 내용은 <code>/about</code> 페이지에 표시됩니다. 비운 항목은 기본 문구로 대체됩니다.
      </p>

      <AboutEditor defaults={about} disabled={!enabled} />
    </main>
  );
}
