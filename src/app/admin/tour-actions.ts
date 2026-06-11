'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { setSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import {
  TourDetailSchema,
  TourClassesSchema,
  getTourCatalogEntry,
  type TourDetail,
  type TourClasses
} from '@/lib/tour';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) {
    throw new Error('unauthorized');
  }
}

export type TourActionState = { ok?: boolean; error?: string };

/** 투어 상세 저장(slug 별 단일 키 upsert). 목록은 코드 카탈로그 고정이라 생성/삭제 없음. */
export async function saveTour(slug: string, input: TourDetail): Promise<TourActionState> {
  await requireAdmin();
  if (!getTourCatalogEntry(slug)) return { error: '존재하지 않는 투어입니다.' };
  const parsed = TourDetailSchema.safeParse(input);
  if (!parsed.success) return { error: '입력 형식이 올바르지 않습니다.' };
  try {
    await setSiteContent(CONTENT_KEYS.tour(slug), parsed.data);
    revalidatePath('/', 'layout'); // /tours/[slug]·홈 카드 무효화
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '저장 실패' };
  }
}

/**
 * 낚시 공통 클래스(미들/럭셔리) 저장 — 단일 키 upsert.
 * 한 번 저장하면 4개 낚시 투어 상세에 모두 반영된다(동기화). 어느 낚시 투어 편집 화면에서 저장해도 동일.
 */
export async function saveFishingClasses(input: TourClasses): Promise<TourActionState> {
  await requireAdmin();
  const parsed = TourClassesSchema.safeParse(input);
  if (!parsed.success) return { error: '입력 형식이 올바르지 않습니다.' };
  try {
    await setSiteContent(CONTENT_KEYS.fishingClasses, parsed.data);
    revalidatePath('/', 'layout'); // 모든 낚시 /tours/[slug] 무효화
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '저장 실패' };
  }
}
