'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { NewGeoCheckSchema } from '@/lib/geo-checks';
import { replaceGeoChecks } from '@/lib/geo-store';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) throw new Error('unauthorized');
}

export type GeoActionState = { ok?: boolean; saved?: number; error?: string };

/** 한 날짜·플랫폼의 질문별 기록 저장(덮어쓰기). 하나라도 형식이 틀리면 저장하지 않는다. */
export async function saveGeoChecks(checkedOn: string, platform: string, rows: unknown[]): Promise<GeoActionState> {
  await requireAdmin();
  const parsed = rows.map((r) => NewGeoCheckSchema.safeParse({ ...(r as object), checkedOn, platform }));
  const bad = parsed.findIndex((p) => !p.success);
  if (bad !== -1) return { error: `${bad + 1}번째 줄 입력을 확인해 주세요(날짜 형식·출처 주소는 https:// 로 시작).` };
  const items = parsed.flatMap((p) => (p.success ? [p.data] : []));
  const seen = new Set<string>();
  if (items.some((i) => (seen.has(i.question) ? true : (seen.add(i.question), false))))
    return { error: '같은 질문이 두 번 들어 있습니다.' };
  try {
    await replaceGeoChecks(checkedOn, platform, items);
    revalidatePath('/admin/geo');
    return { ok: true, saved: items.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '저장 실패' };
  }
}
