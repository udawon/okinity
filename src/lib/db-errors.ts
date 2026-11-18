/**
 * DB 오류 판별 — SQL(docs/supabase-*.sql)을 아직 실행하지 않아 칸·표가 없는 경우.
 * 그때는 새 칸 없이 다시 저장하거나(예약 문의 유실 방지) 화면에 "SQL 실행 필요"를 띄운다. 범용 순수 모듈.
 */
const CODES = new Set(['PGRST204', 'PGRST205', '42703', '42P01']);

export function isMissingSchemaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' && CODES.has(code);
}

type InsertResult<T> = { data: T; error: unknown };

/**
 * 새 칸(optionalKeys)을 넣어 저장하고, 그 칸이 아직 없다는 오류면 그 칸만 빼고 한 번 더 저장한다.
 * 다른 오류는 숨기지 않고 그대로 돌려준다. 선택 칸이 행에 없으면 재시도할 이유가 없다.
 */
export async function insertWithSchemaFallback<T>(
  insert: (row: Record<string, unknown>) => PromiseLike<InsertResult<T>>,
  row: Record<string, unknown>,
  optionalKeys: string[]
): Promise<InsertResult<T>> {
  const first = await insert(row);
  const hasOptional = optionalKeys.some((k) => k in row);
  if (!first.error || !hasOptional || !isMissingSchemaError(first.error)) return first;
  const base = Object.fromEntries(Object.entries(row).filter(([k]) => !optionalKeys.includes(k)));
  return insert(base);
}
