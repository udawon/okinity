import 'server-only';

/**
 * 엔(JPY) → 원(KRW) 환율 조회 — 정산금액 ₩/¥ 자동 변환용.
 * open.er-api.com 무료 엔드포인트(키 불필요, 일 1회 갱신)를 1시간 캐시로 사용한다.
 * 실패 시 폴백 환율로 graceful degrade (어드민 정산 입력이 막히지 않도록).
 */

// 폴백(네트워크 실패 시) — 대략적 기준. 어드민에서 환율 직접 조정 가능.
const FALLBACK_JPY_KRW = 9.3;

export type ExchangeRate = {
  /** 1 JPY = rate KRW */
  jpyKrw: number;
  /** 마지막 갱신 표시용 문자열(소스 제공) */
  asOf: string;
  /** 실시간 조회 성공 여부(false면 폴백) */
  live: boolean;
};

export async function getJpyKrwRate(): Promise<ExchangeRate> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/JPY', {
      next: { revalidate: 3600 } // 1시간 캐시
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    const rate = data?.rates?.KRW;
    if (data?.result === 'success' && typeof rate === 'number' && rate > 0) {
      return { jpyKrw: rate, asOf: data.time_last_update_utc ?? '', live: true };
    }
    throw new Error('invalid payload');
  } catch {
    return { jpyKrw: FALLBACK_JPY_KRW, asOf: '', live: false };
  }
}
