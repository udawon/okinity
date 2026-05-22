/**
 * 서버 시작 시 1회 실행되는 훅 (Next.js instrumentation).
 * 프로덕션에서 빠지면 "조용히" 문제가 되는 환경변수를 시작 시점에 큰 경고로 알린다.
 * 가장 위험한 건 POSTGRES_URL 미설정 → 서버리스에서 문의 데이터가 사라지는 것.
 */
export async function register() {
  // Node 런타임에서만 1회 (edge 중복 실행 방지)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // 개발 모드에서는 경고하지 않음 (JSON 파일 저장이 정상 동작)
  if (process.env.NODE_ENV !== 'production') return;

  const problems: string[] = [];

  if (!process.env.POSTGRES_URL) {
    problems.push(
      'POSTGRES_URL 미설정 — 문의가 JSON 파일(.data)에 저장됩니다. ' +
        '서버리스(Vercel 등)에서는 재배포·스케일 시 데이터가 사라집니다. ' +
        'Postgres(Neon/Vercel Postgres/Supabase)를 연결하세요.'
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
      '\n⚠  PONYOKINAWA 프로덕션 설정 경고 — 배포 전 확인 필요\n' +
      line +
      '\n' +
      problems.map((p, i) => `  ${i + 1}. ${p}`).join('\n\n') +
      '\n' +
      line +
      '\n'
  );
}
