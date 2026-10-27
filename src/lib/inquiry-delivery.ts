import { site } from '@/config/site.config';
import type { NewInquiry } from './inquiries/types';

/**
 * 예약 문의 전달 — 알림 메일 구성과, 저장·메일 결과에 따른 고객 응답 결정.
 *
 * 부분 실패 정책: 저장 또는 메일 중 하나라도 운영자에게 닿았으면 접수 성공.
 * 저장소 장애(예: 2026-10 Supabase 용량 정지) 때도 메일로는 문의를 받는다.
 */

/** 메일 발송 결과. skipped = 메일 키 미설정(로컬)이라 콘솔에만 기록 — 발송이 아니다. */
export type EmailResult = 'sent' | 'skipped' | 'failed';

export type Notif = { subject: string; text: string; html: string; replyTo?: string };

const STORE_FAILED_NOTICE =
  '⚠ 이 문의는 저장소 장애로 어드민 예약 목록에 저장되지 않았습니다. 이 메일로 직접 회신·처리하세요.';

/** HTML 이스케이프 — 사용자 입력을 이메일 본문에 안전하게 넣는다. */
function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 문의 데이터로 알림 이메일(제목·텍스트·HTML)을 구성한다. 저장 실패면 제목·본문에 경고를 붙인다. */
export function buildInquiryEmail(data: NewInquiry, { stored }: { stored: boolean }): Notif {
  const adminUrl = `${site.url}/admin`;
  const rows: [string, string][] = [
    ['상품', data.product ?? '-'],
    ['희망일', data.date ?? '-'],
    ['희망 시간대', data.time ?? '-'],
    ['인원', data.people != null ? `${data.people}명` : '-'],
    ['성함', data.name],
    ['이메일', data.email || '-'],
    ['연락처', data.contact],
    ['메시지', data.message ?? '-']
  ];

  const subject =
    (stored ? '' : '[저장 실패·메일로 처리] ') +
    `[OKINITY] 새 예약 문의 — ${data.name}` +
    (data.product ? ` · ${data.product}` : '');

  const text =
    (stored ? '' : `${STORE_FAILED_NOTICE}\n\n`) +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\n예약 관리: ${adminUrl}`;

  const trs = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#64748b;white-space:nowrap;vertical-align:top">${k}</td>` +
        `<td style="padding:8px 12px;color:#0f172a;font-weight:600">${esc(v).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');

  const warning = stored
    ? ''
    : `<div style="padding:14px 24px;background:#fef2f2;color:#b91c1c;font-size:14px;font-weight:600;border-bottom:1px solid #fecaca">${STORE_FAILED_NOTICE}</div>`;

  const html = `
  <div style="background:#f1f5f9;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#02101e;padding:18px 24px">
        <p style="margin:0;color:#7dd3fc;font-size:12px;letter-spacing:2px">OKINITY · 새 예약 문의</p>
      </div>
      ${warning}
      <table style="width:100%;border-collapse:collapse;font-size:14px">${trs}</table>
      <div style="padding:20px 24px;border-top:1px solid #e2e8f0">
        <a href="${adminUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">예약 관리에서 처리하기 →</a>
      </div>
    </div>
  </div>`;

  // 회신은 고객 이메일로(없으면 연락처가 이메일 형식일 때만).
  const replyTo = data.email || (data.contact.includes('@') ? data.contact : undefined);
  return { subject, text, html, replyTo };
}

/** 저장·메일 결과 → 고객 응답. 운영자에게 하나도 닿지 않았을 때만 실패. */
export function inquiryResult(
  stored: boolean,
  email: EmailResult
): { status: number; body: Record<string, unknown> } {
  if (stored) {
    return email === 'failed'
      ? { status: 200, body: { ok: true, delivery: 'stored_email_failed' } }
      : { status: 200, body: { ok: true } };
  }
  if (email === 'sent') return { status: 200, body: { ok: true, delivery: 'email_only' } };
  return { status: 500, body: { error: 'store_failed' } };
}
