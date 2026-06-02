import { getGallery, getSchedule, type GalleryItem, type ScheduleItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { HERO_DEFAULTS } from '@/components/ocean-home-data';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import HeroForm from '@/components/admin/HeroForm';
import GalleryForm from '@/components/admin/GalleryForm';
import ScheduleForm from '@/components/admin/ScheduleForm';
import TourImagesForm from '@/components/admin/TourImagesForm';
import SectionPreview from '@/components/admin/SectionPreview';
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
  // Hero 폼 기본값 — 저장된 오버라이드가 있으면 그 값, 없으면 현재 표시되는 기본 문구.
  const heroOv = (overrides[CONTENT_KEYS.hero] ?? {}) as {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    mediaUrl?: string;
    mediaType?: string;
  };
  const hero = {
    eyebrow: heroOv.eyebrow?.trim() || HERO_DEFAULTS.eyebrow,
    title: heroOv.title?.trim() || HERO_DEFAULTS.title,
    subtitle: heroOv.subtitle?.trim() || HERO_DEFAULTS.subtitle,
    mediaUrl: heroOv.mediaUrl,
    mediaType: heroOv.mediaType
  };
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
    <AdminShell title="콘텐츠 편집">
      <div className="space-y-6">
        <EditSection
          title="Hero (홈 첫 화면)"
          desc={
            <>
              홈 첫 화면의 <strong>배경 영상/이미지</strong>와 <strong>제목·부제 문구</strong>를
              교체합니다. 비우면 기본값이 사용됩니다. 동영상은 자동재생(무음 루프)됩니다.
            </>
          }
          preview={
            <SectionPreview highlight="hero" note="홈 맨 위 전체화면 배경·문구에 적용됩니다." />
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
          title="갤러리"
          desc="홈 갤러리(반응형 그리드)와 /갤러리 페이지에 올린 순서대로 노출됩니다. 이미지를 추가/삭제하세요."
          preview={<SectionPreview highlight="gallery" note="홈 갤러리 그리드 + /gallery 페이지." />}
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
    </AdminShell>
  );
}
