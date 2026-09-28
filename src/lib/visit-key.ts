/**
 * 방문자 집계 키 — 쿠키 없이 "하루 1명"을 센다. 범용 순수 모듈(Web Crypto).
 *
 * 방문자 값 = HMAC(비밀키, 날짜|IP|브라우저) 앞 32자.
 *  · IP 원문은 저장하지 않는다(해시만 저장).
 *  · 날짜가 입력에 들어가므로 같은 사람도 날마다 다른 값 → 날짜를 넘어 추적할 수 없다.
 *  · 한계: 같은 와이파이·같은 기종은 1명으로, 하루 중 IP 가 바뀌면 2명으로 셀 수 있다(참고 지표).
 */

/** 오키나와(JST) 기준 YYYY-MM-DD. */
export function jstDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|headless|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|okhttp|vercel|scrap/i; // scrap: kakaotalk-scrap(링크 미리보기) 등

/** 검색엔진·미리보기·스크립트 요청 판별. 브라우저 정보가 비어 있어도 봇으로 본다. */
export function isBot(userAgent: string): boolean {
  return !userAgent.trim() || BOT_RE.test(userAgent);
}

/** 프록시(Vercel) 뒤의 실제 접속 IP. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return (headers.get('x-real-ip') ?? '').trim();
}

export async function visitorHash(secret: string, day: string, ip: string, userAgent: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(`visit:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign'
  ]);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${day}|${ip}|${userAgent}`)));
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}
