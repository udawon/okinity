import { getAllProducts, getGallery, getSchedule, type GalleryItem, type ScheduleItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';
import HeroForm from '@/components/admin/HeroForm';
import ProductForm from '@/components/admin/ProductForm';
import GalleryForm from '@/components/admin/GalleryForm';
import ScheduleForm from '@/components/admin/ScheduleForm';
import TourImagesForm from '@/components/admin/TourImagesForm';
import SectionPreview from '@/components/admin/SectionPreview';
import { logout } from '../actions';
import { type ReactNode } from 'react';

export const dynamic = 'force-dynamic';

const sectionCls = 'rounded-card border border-line bg-surface p-5 sm:p-6';
const sectionTitleCls = 'text-lg font-bold text-ink';

/** 편집기(좌) + 랜딩 적용 위치 미리보기(우) 2열 레이아웃 섹션 래퍼. */
function EditSection({
  title,
  desc,
  preview,
  children
}: {
  title: string;
  desc: ReactNode;
  preview: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={sectionCls}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <h2 className={sectionTitleCls}>{title}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">{desc}</p>
          {children}
        </div>
        <div className="lg:border-l lg:border-line lg:pl-6">{preview}</div>
      </div>
    </section>
  );
}

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
        <EditSection
          title="Hero 배경 (홈 첫 화면)"
          desc={
            <>
              홈 첫 화면의 <strong>배경 영상/이미지</strong>를 교체합니다. 비우면 기본 노을 영상.
              동영상은 자동재생(무음 루프)됩니다. (제목·부제 문구는 현재 코드 고정 — 배경만 반영)
            </>
          }
          preview={
            <SectionPreview highlight="hero" note="홈 맨 위 전체화면 배경에 적용됩니다." />
          }
        >
          <HeroForm defaults={hero} disabled={!enabled} />
        </EditSection>

        <EditSection
          title="투어 카테고리 이미지 (홈 캐러셀)"
          desc="홈 투어 카테고리 카드(다이빙·PADI·낚시·스노클링)의 이미지. 비운 항목은 기본 이미지를 사용합니다."
          preview={
            <SectionPreview
              highlight="tours"
              note="홈 '네 가지 방법으로 만나는 바다' 캐러셀 카드 이미지."
            />
          }
        >
          <TourImagesForm defaults={tourImages} disabled={!enabled} />
        </EditSection>

        <EditSection
          title="투어 상품 (상품 상세 페이지)"
          desc="각 상품의 이미지·제목·설명·가격. 비운 항목은 기본값(content/*.md)을 사용합니다."
          preview={
            <SectionPreview note="홈에는 미노출 — 메뉴 ▸ 각 투어의 상세(/products) 페이지에 적용됩니다." />
          }
        >
          <div className="grid gap-4 xl:grid-cols-2">
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
        </EditSection>

        <EditSection
          title="갤러리"
          desc="홈 갤러리(가로로 흐르는 띠)와 /갤러리 페이지에 노출됩니다. 이미지를 추가/삭제하세요."
          preview={<SectionPreview highlight="gallery" note="홈 갤러리 띠 + /gallery 페이지." />}
        >
          <GalleryForm defaults={galleryDefaults} disabled={!enabled} />
        </EditSection>

        <EditSection
          title="일정표"
          desc="홈 하단 '일정 · 예약' 달력과 /일정표 페이지에 표시됩니다. 날짜·프로그램·상태를 추가/삭제하세요."
          preview={<SectionPreview highlight="schedule" note="홈 맨 아래 예약 섹션 + /schedule 페이지." />}
        >
          <ScheduleForm defaults={scheduleDefaults} disabled={!enabled} />
        </EditSection>
      </div>
    </main>
  );
}
