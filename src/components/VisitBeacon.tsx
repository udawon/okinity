'use client';

import { useEffect } from 'react';
import { classifySource } from '@/lib/traffic-source';
import { rememberSource } from '@/lib/source-memory';

/**
 * 방문 비콘 — 공개 페이지에 들어오면 하루 한 번 /api/visit 에 알린다(서버가 중복·봇을 거른다).
 * 같은 브라우저는 그날 다시 보내지 않도록 localStorage 에 날짜만 적어 둔다(개인정보 없음).
 *
 * 유입처(어디서 왔는지 — ChatGPT·네이버·인스타그램 등, 사이트 이름만)도 함께 보내고, 예약 문의에 쓰도록
 * 처음(30일)·마지막 유입처를 브라우저에 기억한다(lib/source-memory). 유입처 기억은 매 페이지 열 때 갱신.
 */
export default function VisitBeacon() {
  useEffect(() => {
    const source = classifySource({
      referrer: document.referrer,
      url: location.href,
      ua: navigator.userAgent,
      host: location.host
    });
    rememberSource(source);

    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
    const key = 'okinity-visit-day';
    try {
      if (localStorage.getItem(key) === day) return;
      localStorage.setItem(key, day);
    } catch {
      // 저장소를 막은 브라우저 — 매 페이지 전송해도 서버가 같은 날 중복을 거른다
    }
    const body = JSON.stringify({ source });
    const sent =
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/visit', new Blob([body], { type: 'application/json' }));
    if (!sent)
      fetch('/api/visit', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body }).catch(
        () => {}
      );
  }, []);
  return null;
}
