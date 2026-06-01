'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { setSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { TourDetailSchema, getTourCatalogEntry, type TourDetail } from '@/lib/tour';

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
