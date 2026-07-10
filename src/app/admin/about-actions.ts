'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import {
  setSiteContent,
  CONTENT_KEYS,
  localizedContentKey,
  isContentLocale
} from '@/lib/site-content';
import { AboutContentSchema, type AboutContent } from '@/lib/about';

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySession(jar.get(ADMIN_COOKIE)?.value))) {
    throw new Error('unauthorized');
  }
}

export type AboutActionState = { ok?: boolean; error?: string };

/** 소개(About) 콘텐츠 저장(언어별 키 upsert). */
export async function saveAbout(
  input: AboutContent,
  lang: string = 'ko'
): Promise<AboutActionState> {
  await requireAdmin();
  if (!isContentLocale(lang)) return { error: '지원하지 않는 언어입니다.' };
  const parsed = AboutContentSchema.safeParse(input);
  if (!parsed.success) return { error: '입력 형식이 올바르지 않습니다.' };
  try {
    await setSiteContent(localizedContentKey(CONTENT_KEYS.about, lang), parsed.data);
    revalidatePath('/', 'layout'); // /about 무효화
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '저장 실패' };
  }
}
