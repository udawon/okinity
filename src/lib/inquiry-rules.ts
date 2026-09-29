import { parseProduct } from './inquiry-product';
import { bookableOptions, resolveTourDetail } from './tour';
import { optionPeopleRange } from './tour-options';

/**
 * 예약 접수 서버 검증 — 고른 옵션의 인원 조건(최소~최대)을 벗어난 예약인지.
 * 화면(예약 폼·투어 페이지)이 이미 막지만, 화면을 거치지 않은 요청이나 조건이 바뀐 뒤의 옛 화면도 막는다.
 * 판단할 수 없으면(옵션 없음·모르는 옵션·인원 없음) 막지 않는다 — 진짜 손님 예약을 잃지 않는 쪽을 택한다.
 * tourDoc 은 그 투어의 한국어 저장본(site_content `tour:{slug}`). 범용 순수 모듈.
 */
export function optionPeopleViolation(
  product: string | undefined,
  people: number | undefined,
  tourDoc: unknown
): { min: number; max: number } | null {
  if (people == null) return null;
  const { slug, extra } = parseProduct(product);
  if (!slug || !extra) return null;
  const base = resolveTourDetail(slug, tourDoc ?? null);
  const option = bookableOptions(slug, base, base).find((o) => o.name.trim() === extra.trim());
  if (!option) return null;
  const range = optionPeopleRange(option);
  return people < range.min || people > range.max ? range : null;
}
