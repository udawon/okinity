import { NextResponse } from 'next/server';
import { site } from '@/config/site.config';
import { getInquiryStore, NewInquirySchema } from '@/lib/inquiries';

/**
 * 예약 문의 처리.
 *
 * 1) 저장소에 영속(source of truth — 어드민에서 조회). 저장 실패 시에만 에러.
 * 2) 강사 이메일 알림(best-effort). 이메일 실패해도 문의는 이미 저장됨 → ok 반환.
 *    (설계 검토에서 지적된 부분-실패 정책: 저장 성공이 곧 접수 성공.)
 *
 * 저장소: POSTGRES_URL 있으면 Postgres, 없으면 JSON 파일(로컬). src/lib/inquiries 참조.
 * 보안: 허니팟(company 필드) + IP 기준 단순 rate-limit.
 *   ⚠ in-memory rate-limit은 단일 인스턴스 가정. 서버리스/다중 인스턴스에서는
 *     Upstash 등 외부 저장소로 교체 필요.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

async function sendEmail(text: string, name: string, replyTo?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.INQUIRY_TO_EMAIL ?? site.contact.email;
  const fromEmail = process.env.INQUIRY_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!apiKey) {
    console.info('[inquiry] (이메일 미설정 — 콘솔 로그)\n' + text);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `[PONYOKINAWA] 새 예약 문의 — ${name}`,
      text,
      reply_to: replyTo
    })
  });
  if (!res.ok) {
    throw new Error(`resend failed: ${await res.text()}`);
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 허니팟: 채워졌으면 봇 → 성공인 척 무시
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const parsed = NewInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  const data = parsed.data;

  // 1) 저장 (실패 시에만 접수 실패)
  try {
    const store = await getInquiryStore();
    await store.create(data);
  } catch (err) {
    console.error('[inquiry] store failed', err);
    return NextResponse.json({ error: 'store_failed' }, { status: 500 });
  }

  // 2) 이메일 알림 (best-effort)
  const text = [
    `상품: ${data.product ?? '-'}`,
    `희망일: ${data.date ?? '-'}`,
    `인원: ${data.people ?? '-'}`,
    `성함: ${data.name}`,
    `연락처: ${data.contact}`,
    `메시지: ${data.message ?? '-'}`
  ].join('\n');

  try {
    await sendEmail(text, data.name, data.contact.includes('@') ? data.contact : undefined);
  } catch (err) {
    console.error('[inquiry] email failed (저장은 완료됨)', err);
    // 저장은 됐으므로 접수는 성공으로 처리
    return NextResponse.json({ ok: true, delivery: 'stored_email_failed' });
  }

  return NextResponse.json({ ok: true });
}
