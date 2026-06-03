'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  createSession,
  verifyPassword,
  verifySession
} from '@/lib/admin-auth';
import {
  getInquiryStore,
  INQUIRY_STATUSES,
  NewInquirySchema,
  type InquiryStatus
} from '@/lib/inquiries';

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  if (!verifyPassword(password)) {
    return { error: 'invalid' };
  }

  const token = await createSession();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S
  });

  // open-redirect 방지: /admin 하위 경로만 허용
  const from = String(formData.get('from') ?? '');
  redirect(from.startsWith('/admin') ? from : '/admin');
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect('/admin/login');
}

async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  const ok = await verifySession(jar.get(ADMIN_COOKIE)?.value);
  if (!ok) throw new Error('unauthorized');
}

export async function updateInquiryStatus(
  id: string,
  status: string
): Promise<void> {
  // 서버액션은 외부에서 직접 호출 가능하므로 세션을 재검증한다(미들웨어 외 2차 방어).
  await requireAdmin();
  if (!INQUIRY_STATUSES.includes(status as InquiryStatus)) {
    throw new Error('invalid status');
  }
  const store = await getInquiryStore();
  await store.updateStatus(id, status as InquiryStatus);
  revalidatePath('/admin');
  revalidatePath('/admin/board');
}

export async function updateInquiryNote(id: string, note: string): Promise<void> {
  await requireAdmin();
  if (note.length > 2000) throw new Error('note too long');
  const store = await getInquiryStore();
  await store.updateNote(id, note);
  revalidatePath('/admin');
  revalidatePath('/admin/board');
}

export async function updateScheduledTime(id: string, time: string): Promise<void> {
  await requireAdmin();
  // HH:MM 또는 빈 문자열만 허용
  if (time && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('invalid time');
  const store = await getInquiryStore();
  await store.updateScheduledTime(id, time);
  revalidatePath('/admin');
  revalidatePath('/admin/board');
}

export async function updateInquiry(id: string, input: unknown): Promise<void> {
  await requireAdmin();
  const parsed = NewInquirySchema.safeParse(input);
  if (!parsed.success) throw new Error('invalid inquiry');
  const store = await getInquiryStore();
  await store.update(id, parsed.data);
  revalidatePath('/admin');
  revalidatePath('/admin/board');
}

export async function deleteInquiry(id: string): Promise<void> {
  // 서버액션은 외부에서 직접 호출 가능하므로 세션을 재검증한다(미들웨어 외 2차 방어).
  await requireAdmin();
  const store = await getInquiryStore();
  await store.delete(id);
  revalidatePath('/admin');
  revalidatePath('/admin/board');
}
