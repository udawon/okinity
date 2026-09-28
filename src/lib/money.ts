/**
 * 금액 표기 — 엔(JPY) 표시를 로케일에 맞춘다. 범용 순수 모듈.
 * ko: 13,000엔 · en: ¥13,000 · ja: 13,000円
 */
export function formatYen(amount: number, locale: string): string {
  const n = new Intl.NumberFormat('en-US').format(Math.round(amount));
  if (locale === 'en') return `¥${n}`;
  if (locale === 'ja') return `${n}円`;
  return `${n}엔`;
}

/** 원화 참고 금액(이미 천 원 단위로 반올림된 값) → "115,000원" */
export function formatKrw(amount: number): string {
  return `${new Intl.NumberFormat('en-US').format(Math.round(amount))}원`;
}
