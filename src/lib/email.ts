import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface ConsultationEmailData {
  customerName: string;
  customerEmail: string;
  preferredContact: string;
  contactId: string;
  tourTitle: string;
  preferredDate: string;
  partySize: number;
  message?: string;
  language: string;
}

export async function sendConsultationAlert(data: ConsultationEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@okinity.com';

  // Email to admin/consultant
  await getResend().emails.send({
    from: 'OKINITY <noreply@okinity.com>',
    to: adminEmail,
    subject: `[新規相談] ${data.customerName} — ${data.tourTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2EC4B6;">새로운 상담 신청이 도착했습니다</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #666;">이름</td><td style="padding: 8px; font-weight: bold;">${data.customerName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">이메일</td><td style="padding: 8px;">${data.customerEmail}</td></tr>
          <tr><td style="padding: 8px; color: #666;">선호 연락</td><td style="padding: 8px;">${data.preferredContact}: ${data.contactId}</td></tr>
          <tr><td style="padding: 8px; color: #666;">투어</td><td style="padding: 8px; font-weight: bold;">${data.tourTitle}</td></tr>
          <tr><td style="padding: 8px; color: #666;">희망 날짜</td><td style="padding: 8px;">${data.preferredDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">인원</td><td style="padding: 8px;">${data.partySize}명</td></tr>
          <tr><td style="padding: 8px; color: #666;">언어</td><td style="padding: 8px;">${data.language}</td></tr>
          ${data.message ? `<tr><td style="padding: 8px; color: #666;">메시지</td><td style="padding: 8px;">${data.message}</td></tr>` : ''}
        </table>
      </div>
    `,
  });

  // Confirmation email to customer
  const subjects: Record<string, string> = {
    ko: `[OKINITY] 상담 신청이 접수되었습니다`,
    ja: `[OKINITY] ご相談を受け付けました`,
    en: `[OKINITY] Your inquiry has been received`,
  };

  const bodies: Record<string, string> = {
    ko: `<p>${data.customerName}님, 안녕하세요!</p><p>OKINITY 상담 신청이 정상적으로 접수되었습니다.<br>전문 상담사가 곧 연락드리겠습니다.</p><p>감사합니다,<br><strong>OKINITY</strong></p>`,
    ja: `<p>${data.customerName}様</p><p>OKINITYへのご相談をお受けしました。<br>専門スタッフよりまもなくご連絡いたします。</p><p>よろしくお願いいたします。<br><strong>OKINITY</strong></p>`,
    en: `<p>Dear ${data.customerName},</p><p>We've received your inquiry at OKINITY.<br>Our specialist will contact you shortly.</p><p>Best regards,<br><strong>OKINITY</strong></p>`,
  };

  await getResend().emails.send({
    from: 'OKINITY <noreply@okinity.com>',
    to: data.customerEmail,
    subject: subjects[data.language] || subjects.en,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0B1426; color: #fff; padding: 32px; border-radius: 12px;">
        <h1 style="color: #2EC4B6; font-size: 24px; margin-bottom: 20px;">OKINITY</h1>
        ${bodies[data.language] || bodies.en}
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
        <p style="color: #94A3B8; font-size: 12px;">We guide to the future</p>
      </div>
    `,
  });
}
