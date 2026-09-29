'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { syncItemFor, syncTranslations } from '@/lib/content-sync-server';
import { translationEnabled } from '@/lib/translate';
import type { SyncOutcome } from '@/lib/content-sync';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) {
    throw new Error('unauthorized');
  }
}

export type SyncItemState = { ok?: boolean; error?: string; sync?: SyncOutcome };

/**
 * "번역 맞추기" — 콘텐츠 하나를 한국어 기준으로 다시 번역한다. 화면이 항목마다 한 번씩 부른다
 * (한 요청이 서버 함수 시간 한도를 넘지 않게). 대상은 lib/content-sync-server 의 목록으로 제한.
 */
export async function syncTranslationItem(key: string): Promise<SyncItemState> {
  await requireAdmin();
  const item = syncItemFor(key);
  if (!item) return { error: '번역 대상이 아닙니다.' };
  if (!translationEnabled()) return { error: '자동 번역이 꺼져 있습니다(번역 API 키 미설정).' };
  const sync = await syncTranslations(item);
  revalidatePath('/', 'layout');
  if (sync.error) return { error: sync.error, sync };
  return { ok: true, sync };
}
