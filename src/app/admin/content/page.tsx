import { getSiteContent } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';
import HeroForm from '@/components/admin/HeroForm';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

const sectionCls = 'rounded-card border border-line bg-surface p-5 sm:p-6';
const sectionTitleCls = 'text-lg font-bold text-ink';

export default async function AdminContentPage() {
  const enabled = isSupabaseEnabled();
  const hero = enabled ? ((await getSiteContent('hero')) ?? {}) : {};

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">콘텐츠 편집</h1>
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
          <p className="font-semibold">Supabase가 아직 연결되지 않았습니다.</p>
          <p className="mt-1">
            콘텐츠 편집·이미지 업로드를 사용하려면 <code>.env.local</code> 에{' '}
            <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> 를 설정하고{' '}
            <code>supabase/schema.sql</code> 을 실행하세요. 그 전까지 메인은 기본
            콘텐츠(content/*.md)로 정상 표시됩니다.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>Hero (메인 상단)</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            첫 화면의 배경 이미지/동영상과 문구. 비운 항목은 기본값을 사용합니다.
          </p>
          <HeroForm defaults={hero} disabled={!enabled} />
        </section>

        {/* 다음 단계: 투어 상품 / 시그니처 경험 / 갤러리 편집 폼 */}
        <section className={`${sectionCls} opacity-60`}>
          <h2 className={sectionTitleCls}>투어 상품 · 시그니처 · 갤러리</h2>
          <p className="mt-1 text-sm text-muted">
            (준비 중 — Hero 동작 확인 후 동일 패턴으로 추가됩니다)
          </p>
        </section>
      </div>
    </main>
  );
}
