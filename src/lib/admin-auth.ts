/**
 * 어드민 세션 — 비밀번호 로그인 후 HMAC-SHA256 서명 토큰을 쿠키에 저장.
 * Web Crypto만 사용하므로 edge 미들웨어와 node 서버액션 양쪽에서 동작한다.
 *
 * 토큰 형식: base64url(payloadJSON).base64url(HMAC(payloadJSON))
 * payload: { exp: number(ms) }
 */
export const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12시간

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  // 운영에서는 시크릿이 없거나 약하면 구동을 거부한다(fail-closed).
  // 폴백을 허용하면 공개 소스의 기본 시크릿으로 세션이 위조될 수 있다.
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'ADMIN_SESSION_SECRET 미설정 또는 32자 미만 — 운영 환경에서 어드민 세션을 발급할 수 없습니다.'
      );
    }
    return secret;
  }
  // 개발 편의용 폴백 — 운영에서는 반드시 ADMIN_SESSION_SECRET 설정.
  return secret || 'dev-insecure-secret-change-me';
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return atob(b64);
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

/** 상수 시간 문자열 비교 (타이밍 공격 방지). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = b64url(enc.encode(payload));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return false;

  const expected = await hmac(payloadB64);
  if (!safeEqual(sig, expected)) return false;

  try {
    const { exp } = JSON.parse(b64urlDecode(payloadB64)) as { exp: number };
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

/** 로그인 비밀번호 검증 (상수 시간). ADMIN_PASSWORD 미설정 시 항상 실패. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export const SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;
