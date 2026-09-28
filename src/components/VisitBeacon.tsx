'use client';

import { useEffect } from 'react';

/**
 * 방문 비콘 — 공개 페이지에 들어오면 하루 한 번 /api/visit 에 알린다(서버가 중복·봇을 거른다).
 * 같은 브라우저는 그날 다시 보내지 않도록 localStorage 에 날짜만 적어 둔다(개인정보 없음).
 */
export default function VisitBeacon() {
  useEffect(() => {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
    const key = 'okinity-visit-day';
    try {
      if (localStorage.getItem(key) === day) return;
      localStorage.setItem(key, day);
    } catch {
      // 저장소를 막은 브라우저 — 매 페이지 전송해도 서버가 같은 날 중복을 거른다
    }
    const sent = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon('/api/visit');
    if (!sent) fetch('/api/visit', { method: 'POST', keepalive: true }).catch(() => {});
  }, []);
  return null;
}
