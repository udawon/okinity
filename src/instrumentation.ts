/**
 * 서버 시작 시 1회 실행되는 훅 (Next.js instrumentation).
 * 프로덕션에서 빠지면 "조용히" 문제가 되는 환경변수를 시작 시점에 큰 경고로 알린다.
 * 점검: 문의 저장소(Supabase/Postgres) 미설정 시 데이터 휘발, 알림 메일(RESEND) 미발송,
 *      어드민 로그인/세션 시크릿 누락.
 */
export async function register() {
  // Node 런타임에서만 1회 (edge 중복 실행 방지)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // 개발 모드에서는 경고하지 않음 (JSON 파일 저장이 정상 동작)
  if (process.env.NODE_ENV !== 'production') return;

  const problems: string[] = [];

  // 문의 저장소 — Supabase(기본) 또는 Postgres 중 하나면 영속. 둘 다 없을 때만 휘발 경고.
  // (getInquiryStore 우선순위: Supabase → Postgres → JSON 파일)
  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasPostgres = !!process.env.POSTGRES_URL;
  if (!hasSupabase && !hasPostgres) {
    problems.push(
      '문의 저장소 미설정 — Supabase/Postgres가 모두 없어 문의가 JSON 파일(.data)에 저장됩니다. ' +
        '서버리스(Vercel 등)에서는 재배포·스케일 시 데이터가 사라집니다. ' +
        'SUPABASE_URL+SUPABASE_SERVICE_ROLE_KEY 또는 POSTGRES_URL을 설정하세요.'
    );
  }
  // 알림 메일 — 미설정 시 새 예약 문의가 콘솔 로그로만 남고 메일이 발송되지 않는다(예약 누락 위험).
  if (!process.env.RESEND_API_KEY) {
    problems.push(
      'RESEND_API_KEY 미설정 — 새 예약 문의 알림 메일이 발송되지 않습니다. ' +
        '(문의는 저장되어 어드민에서 확인 가능하나, 운영자가 어드민을 보지 않으면 예약을 놓칠 수 있음) ' +
        '알림을 받으려면 RESEND_API_KEY와 INQUIRY_FROM_EMAIL(인증 도메인 발신주소)을 설정하세요.'
    );
  }
  if (!process.env.ADMIN_PASSWORD) {
    problems.push('ADMIN_PASSWORD 미설정 — 어드민(/admin) 로그인이 불가능합니다.');
  }
  if (!process.env.ADMIN_SESSION_SECRET) {
    problems.push(
      'ADMIN_SESSION_SECRET 미설정 — 안전하지 않은 기본 시크릿으로 세션을 서명합니다. ' +
        '임의의 긴 문자열을 설정하세요 (openssl rand -base64 32).'
    );
  }

  if (problems.length === 0) return;

  const line = '─'.repeat(64);
  console.warn(
    '\n' +
      line +
      '\n⚠  OKINITY 프로덕션 설정 경고 — 배포 전 확인 필요\n' +
      line +
      '\n' +
      problems.map((p, i) => `  ${i + 1}. ${p}`).join('\n\n') +
      '\n' +
      line +
      '\n'
  );
}
