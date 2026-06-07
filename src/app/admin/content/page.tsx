import { getGallery, type GalleryItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { HERO_DEFAULTS, ACTIVITIES, ASSURANCES, TESTIMONIALS } from '@/components/ocean-home-data';
import {
  HOME_CONTENT_KEYS,
  parseHomeTestimonials,
  parseHomeAssurances,
  parseHomeTourCopy,
  type AssuranceItem,
  type TestimonialItem,
  type TourCardCopy
} from '@/lib/home-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import HeroForm from '@/components/admin/HeroForm';
import GalleryForm from '@/components/admin/GalleryForm';
import TourImagesForm from '@/components/admin/TourImagesForm';
import TestimonialsForm from '@/components/admin/TestimonialsForm';
import AssurancesForm from '@/components/admin/AssurancesForm';
import TourCopyForm from '@/components/admin/TourCopyForm';
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
    badge1?: string;
    badge2?: string;
    badge3?: string;
    ctaReserve?: string;
    ctaExplore?: string;
  };
  const hero = {
    eyebrow: heroOv.eyebrow?.trim() || HERO_DEFAULTS.eyebrow,
    title: heroOv.title?.trim() || HERO_DEFAULTS.title,
    subtitle: heroOv.subtitle?.trim() || HERO_DEFAULTS.subtitle,
    mediaUrl: heroOv.mediaUrl,
    mediaType: heroOv.mediaType,
    badge1: heroOv.badge1,
    badge2: heroOv.badge2,
    badge3: heroOv.badge3,
    ctaReserve: heroOv.ctaReserve,
    ctaExplore: heroOv.ctaExplore
  };
  const galleryOverrideItems = overrides[CONTENT_KEYS.gallery]?.items;
  const galleryDefaults: GalleryItem[] = Array.isArray(galleryOverrideItems)
    ? (galleryOverrideItems as GalleryItem[])
    : getGallery();
  const tourImages = (overrides[CONTENT_KEYS.homeTours]?.images as Record<string, string>) ?? {};

  // 투어 카드 텍스트 — 저장값 우선, 없으면 현재 한국어(코드 상수) 기본값으로 프리필.
  const tourCopyOv = parseHomeTourCopy(overrides[HOME_CONTENT_KEYS.tourCopy]);
  const tourCats = ACTIVITIES.map((a) => ({ id: a.id, label: a.title }));
  const tourCopyDefaults: Record<string, TourCardCopy> = {};
  for (const a of ACTIVITIES) {
    const ov = tourCopyOv.cards[a.id];
    tourCopyDefaults[a.id] = {
      title: ov?.title?.trim() || a.title,
      tagline: ov?.tagline?.trim() || a.tagline,
      desc: ov?.desc?.trim() || a.desc
    };
  }

  // 신뢰 — 4개 카드, 저장값 우선·없으면 코드 기본값.
  const assuranceOv = parseHomeAssurances(overrides[HOME_CONTENT_KEYS.assurances]);
  const assuranceDefaults: AssuranceItem[] = ASSURANCES.map((x, i) => ({
    title: assuranceOv.items[i]?.title?.trim() || x.title,
    desc: assuranceOv.items[i]?.desc?.trim() || x.desc
  }));

  // 후기 — 저장값 있으면 그것, 없으면 샘플(코드) 프리필.
  const testimonialOv = parseHomeTestimonials(overrides[HOME_CONTENT_KEYS.testimonials]);
  const testimonialDefaults: TestimonialItem[] = testimonialOv.items.length
    ? testimonialOv.items
    : TESTIMONIALS.map((x) => ({ name: x.name, city: x.city, tour: x.tour, quote: x.quote }));

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
          title="투어 카드 텍스트 (홈 캐러셀)"
          desc="홈 투어 카드의 카테고리명·태그라인·설명과 섹션 제목/소개. 비운 칸은 기본 문구를 사용합니다."
          preview={<SectionPreview highlight="tours" note="홈 투어 캐러셀 카드의 텍스트." />}
        >
          <TourCopyForm
            categories={tourCats}
            defaults={tourCopyDefaults}
            defaultTitle={tourCopyOv.sectionTitle}
            defaultIntro={tourCopyOv.sectionIntro}
            disabled={!enabled}
          />
        </EditSection>

        <EditSection
          title="신뢰 영역 (왜 우리인가)"
          desc="홈 '안심하고 맡기세요' 4개 카드의 제목·설명. 아이콘은 고정입니다."
          preview={<SectionPreview highlight="assurance" note="홈 신뢰 배지 4종 카드." />}
        >
          <AssurancesForm
            defaults={assuranceDefaults}
            defaultTitle={assuranceOv.sectionTitle}
            disabled={!enabled}
          />
        </EditSection>

        <EditSection
          title="갤러리"
          desc="홈 갤러리(반응형 그리드)와 /갤러리 페이지에 올린 순서대로 노출됩니다. 이미지를 추가/삭제하세요."
          preview={<SectionPreview highlight="gallery" note="홈 갤러리 그리드 + /gallery 페이지." />}
        >
          <GalleryForm defaults={galleryDefaults} disabled={!enabled} />
        </EditSection>

        <EditSection
          title="후기"
          desc="홈 '다녀온 분들의 이야기' 고객 후기(이름·지역·투어·내용)와 섹션 제목. 추가/수정/삭제하세요."
          preview={<SectionPreview highlight="reviews" note="홈 후기 카드 3열 그리드." />}
        >
          <TestimonialsForm
            defaults={testimonialDefaults}
            defaultTitle={testimonialOv.sectionTitle}
            disabled={!enabled}
          />
        </EditSection>
      </div>
    </AdminShell>
  );
}
