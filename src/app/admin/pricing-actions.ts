'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { setSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { TOUR_CATALOG } from '@/lib/tour';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  const ok = await verifySession(jar.get(ADMIN_COOKIE)?.value);
  if (!ok) throw new Error('unauthorized');
}

/** 투어별 기준 단가 저장(어드민 전용). 카탈로그에 있는 slug만, 0 이상 정수만 반영. */
export async function saveTourPrices(input: Record<string, number>): Promise<void> {
  await requireAdmin();
  const valid = new Set(TOUR_CATALOG.map((t) => t.slug));
  const prices: Record<string, number> = {};
  for (const [slug, v] of Object.entries(input)) {
    if (!valid.has(slug)) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) prices[slug] = Math.round(n);
  }
  await setSiteContent(CONTENT_KEYS.tourPrices, { prices });
  revalidatePath('/admin/tours');
}
