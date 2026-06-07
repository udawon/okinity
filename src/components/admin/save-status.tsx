'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SaveStatus = { text: string; tone: 'ok' | 'err'; at: number } | null;

/**
 * 어드민 저장 피드백 공용 훅.
 *
 * 기존 문제: 각 폼이 "저장되었습니다." 문구를 정적으로 남겨 ① 다른 영역을 저장해도
 * 이전 메시지가 그대로 남아 어느 게 방금 저장인지 모호하고, ② 같은 문구라 재저장해도
 * 화면 변화가 없어 처리 여부를 알 수 없었다.
 *
 * 해결: 저장 시각(타임스탬프)을 함께 남겨 매 저장이 시각적으로 구분되게 하고,
 * 성공 메시지는 일정 시간 뒤 자동으로 사라지게 해 누적·잔존을 막는다.
 */
export function useSaveStatus(autoHideMs = 4000) {
  const [status, setStatus] = useState<SaveStatus>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const show = useCallback(
    (text: string, tone: 'ok' | 'err' = 'ok') => {
      clearTimer();
      setStatus({ text, tone, at: Date.now() });
      // 성공만 자동 소멸. 실패는 사용자가 원인을 읽도록 유지.
      if (tone === 'ok') {
        timer.current = setTimeout(() => setStatus(null), autoHideMs);
      }
    },
    [autoHideMs]
  );

  // 언마운트 시 타이머 정리(unmounted setState 방지).
  useEffect(() => clearTimer, []);

  return { status, show };
}

/** 저장 결과 배지 — 성공(초록·시각 표기·자동 소멸) / 실패(빨강·유지). aria-live로 SR 통지. */
export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (!status) return null;
  const time = new Date(status.at).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const ok = status.tone === 'ok';
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-sm ${ok ? 'text-emerald-600' : 'text-red-600'}`}
    >
      <span aria-hidden>{ok ? '✓' : '⚠'}</span>
      {status.text}
      {ok && <span className="text-muted">· {time}</span>}
    </span>
  );
}
