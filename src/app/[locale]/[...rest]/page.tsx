import { notFound } from 'next/navigation';

/**
 * 로케일 하위 미매칭 경로 캐치올 — /{locale}/존재하지않는경로 를
 * 전역(맨몸·로케일 상실) 404가 아니라 로케일 인지 404([locale]/not-found.tsx)로 보낸다.
 * 캐치올은 우선순위가 가장 낮아 기존 정적/동적 라우트를 침범하지 않는다.
 */
export default function CatchAllNotFound() {
  notFound();
}
