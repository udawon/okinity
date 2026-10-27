import { NextResponse } from 'next/server';
import { site } from '@/config/site.config';
import { getInquiryStore, NewInquirySchema } from '@/lib/inquiries';
import { buildInquiryEmail, inquiryResult, type EmailResult, type Notif } from '@/lib/inquiry-delivery';
import { parseProduct } from '@/lib/inquiry-product';
import { optionPeopleViolation } from '@/lib/inquiry-rules';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';

/**
 * 예약 문의 처리.
 *
 * 1) 저장소에 영속(source of truth — 어드민에서 조회).
 * 2) 강사 이메일 알림. 저장이 실패해도 메일은 보낸다(제목에 '저장 실패' 경고).
 *    부분 실패 정책: 저장·메일 중 하나라도 운영자에게 닿으면 접수 성공(lib/inquiry-delivery).
 *    (2026-10 Supabase 용량 정지 때 저장 실패로 메일까지 끊겨 문의가 유실될 수 있었다.)
 *
 * 저장소(우선순위): Supabase(기본) → Postgres → JSON 파일(로컬 전용·휘발). src/lib/inquiries 참조.
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

/** 'sent' = Resend 가 접수, 'skipped' = 메일 키 미설정(콘솔 기록만). 실패는 throw. */
async function sendEmail(n: Notif): Promise<Exclude<EmailResult, 'failed'>> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.INQUIRY_TO_EMAIL ?? site.contact.email;
  const fromEmail = process.env.INQUIRY_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!apiKey) {
    console.info('[inquiry] (이메일 미설정 — 콘솔 로그)\n' + n.text);
    return 'skipped';
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
      subject: n.subject,
      text: n.text,
      html: n.html,
      reply_to: n.replyTo
    })
  });
  if (!res.ok) {
    throw new Error(`resend failed: ${await res.text()}`);
  }
  return 'sent';
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

  // 옵션 인원 조건(최소~최대) — 화면을 거치지 않은 요청·조건이 바뀐 뒤의 옛 화면도 막는다(lib/inquiry-rules)
  const { slug } = parseProduct(data.product);
  if (slug) {
    const range = optionPeopleViolation(data.product, data.people, await getSiteContent(CONTENT_KEYS.tour(slug)));
    if (range) return NextResponse.json({ error: 'people_range', ...range }, { status: 400 });
  }

  // 1) 저장
  let stored = true;
  try {
    const store = await getInquiryStore();
    await store.create(data);
  } catch (err) {
    console.error('[inquiry] store failed — 메일로만 전달 시도', err);
    stored = false;
  }

  // 2) 이메일 알림 — 저장 실패여도 보낸다(운영자가 메일로 처리)
  let email: EmailResult;
  try {
    email = await sendEmail(buildInquiryEmail(data, { stored }));
  } catch (err) {
    console.error(`[inquiry] email failed (저장 ${stored ? '완료' : '실패'})`, err);
    email = 'failed';
  }

  const { status, body: resBody } = inquiryResult(stored, email);
  return NextResponse.json(resBody, { status });
}
