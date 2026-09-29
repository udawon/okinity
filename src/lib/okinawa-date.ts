/**
 * 날짜 기준 — 영업지(오키나와, JST) 달력. 서버(Vercel, UTC)와 방문자 브라우저(어느 시간대든)가
 * 같은 '오늘'과 같은 날짜 표시를 계산해야 화면이 어긋나지 않는다(하이드레이션 불일치·하루 밀림 방지).
 * 범용 모듈(서버·클라이언트 공용).
 */
export const OKINAWA_TZ = 'Asia/Tokyo';

/** 오늘(오키나와 기준) 'YYYY-MM-DD'. */
export function okinawaTodayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: OKINAWA_TZ }).format(now);
}

/**
 * 'YYYY-MM-DD' → 긴 날짜(요일 포함). 문자열의 날짜를 그대로 보여준다 —
 * `new Date('YYYY-MM-DD')` 는 UTC 자정이라 미국 등에서 하루 전으로 밀려 보인다.
 */
export function formatDateKeyLong(key: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return '';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
}
