/**
 * 어드민 서버액션 호출 보호 — 로그인이 만료됐거나 연결이 끊기면 서버액션은 결과 대신 예외를 던진다.
 * 그대로 두면 화면이 "저장 중…"에 멈추고 새로고침하면 작성분을 잃는다 → 예외를 안내 문구로 바꿔
 * 편집 화면이 입력 내용을 유지한 채 다시 시도하게 한다. 범용 순수 모듈(클라이언트 편집기 공용).
 */
export const ACTION_FAILED_MESSAGE =
  '처리하지 못했어요. 로그인이 만료됐거나 인터넷 연결이 끊겼을 수 있어요. 이 탭은 닫지 말고(입력한 내용은 그대로 있어요), 새 탭에서 okinity.com/admin 에 다시 로그인한 뒤 이 화면에서 방금 누른 버튼을 다시 누르세요.';

export async function safeAction<T extends { error?: string }>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch {
    return { error: ACTION_FAILED_MESSAGE } as T;
  }
}
