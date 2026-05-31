import { getAllProducts, getGallery, getSchedule, type GalleryItem, type ScheduleItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';
import HeroForm from '@/components/admin/HeroForm';
import ProductForm from '@/components/admin/ProductForm';
import GalleryForm from '@/components/admin/GalleryForm';
import ScheduleForm from '@/components/admin/ScheduleForm';
import TourImagesForm from '@/components/admin/TourImagesForm';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

const sectionCls = 'rounded-card border border-line bg-surface p-5 sm:p-6';
const sectionTitleCls = 'text-lg font-bold text-ink';

export default async function AdminContentPage() {
  const enabled = isSupabaseEnabled();
  const overrides = enabled ? await getSiteContentMap() : {};
  const hero = overrides[CONTENT_KEYS.hero] ?? {};
  const products = getAllProducts('ko');
  const galleryOverrideItems = overrides[CONTENT_KEYS.gallery]?.items;
  const galleryDefaults: GalleryItem[] = Array.isArray(galleryOverrideItems)
    ? (galleryOverrideItems as GalleryItem[])
    : getGallery();
  const scheduleOverrideItems = overrides[CONTENT_KEYS.schedule]?.items;
  const scheduleDefaults: ScheduleItem[] = Array.isArray(scheduleOverrideItems)
    ? (scheduleOverrideItems as ScheduleItem[])
    : getSchedule();
  const tourImages = (overrides[CONTENT_KEYS.homeTours]?.images as Record<string, string>) ?? {};

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
          <h2 className={sectionTitleCls}>Hero 배경 (홈 첫 화면)</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            홈 첫 화면의 <strong>배경 영상/이미지</strong>를 교체합니다. 비우면 기본 노을 영상.
            동영상은 자동재생(무음 루프)됩니다. (제목·부제 문구는 현재 코드 고정 — 배경만 반영)
          </p>
          <HeroForm defaults={hero} disabled={!enabled} />
        </section>

        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>투어 카테고리 이미지 (홈 캐러셀)</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            홈 투어 카테고리 카드(다이빙·PADI·낚시·스노클링)의 이미지. 비운 항목은 기본 이미지를
            사용합니다.
          </p>
          <TourImagesForm defaults={tourImages} disabled={!enabled} />
        </section>

        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>투어 상품 (상품 상세 페이지)</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            각 상품의 이미지·제목·설명·가격. 비운 항목은 기본값(content/*.md)을 사용합니다.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((p) => (
              <ProductForm
                key={p.slug}
                slug={p.slug}
                baseTitle={p.title}
                defaults={overrides[CONTENT_KEYS.product(p.slug)] ?? {}}
                disabled={!enabled}
              />
            ))}
          </div>
        </section>

        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>갤러리</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            홈 갤러리(가로로 흐르는 띠)와 /갤러리 페이지에 노출됩니다. 이미지를 추가/삭제하세요.
          </p>
          <GalleryForm defaults={galleryDefaults} disabled={!enabled} />
        </section>

        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>일정표</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            /일정표 달력에 표시됩니다. 날짜·프로그램·상태를 추가/삭제하세요.
          </p>
          <ScheduleForm defaults={scheduleDefaults} disabled={!enabled} />
        </section>
      </div>
    </main>
  );
}
