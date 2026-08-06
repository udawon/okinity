import 'server-only';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifySession } from './admin-auth';

/**
 * 어드민 세션이 유효한 요청인지 — 초안(비공개) 콘텐츠 미리보기 허용 여부.
 *
 * 공개 페이지(/ko/blog/[id]·/ko/notice/[id])에서 쓴다. 세션 쿠키는 path='/' 로 발급되므로
 * 어드민 로그인 상태의 브라우저에서는 공개 경로에도 함께 전송된다.
 * 로그인하지 않은 방문자에게 초안은 지금까지와 똑같이 404 다.
 *
 * 검증 중 예외가 나면 false — "관리자 아님"으로 닫는다(fail-closed).
 * 예외를 그대로 흘리면 세션 시크릿 문제가 공개 페이지의 500 으로 번진다.
 */
export async function isAdminPreview(): Promise<boolean> {
  try {
    const jar = await cookies();
    return await verifySession(jar.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}
