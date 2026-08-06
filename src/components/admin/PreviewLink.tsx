'use client';

import { useState } from 'react';

/**
 * 미리보기 버튼 — 편집 중인 내용을 저장한 뒤 공개 페이지를 새 탭으로 연다.
 * 초안(비공개)도 어드민 로그인 상태에서는 열린다(lib/admin-preview).
 *
 * 저장을 먼저 하는 이유: 미리보기는 서버에 저장된 내용을 렌더한다. 저장 없이 열면
 * 편집 중인 내용이 아니라 이전 저장본(새 글이면 빈 초안)이 보여 "미리보기가 안 된다"고
 * 오해하게 된다. 안내 문구로 떠넘기지 않고 버튼이 알아서 저장한다.
 */
export default function PreviewLink({
  href,
  onBeforeOpen,
  disabled = false
}: {
  href: string;
  /** 열기 전에 실행할 저장. true 를 반환해야 새 탭이 이동한다. */
  onBeforeOpen: () => Promise<boolean>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (busy || disabled) return;

    // 팝업 차단 회피 — 탭 열기는 반드시 사용자 클릭 흐름 안에서 동기적으로 해야 한다.
    // 저장을 await 한 뒤에 window.open 을 부르면 브라우저가 자동 팝업으로 보고 막는다.
    const tab = window.open('', '_blank');
    try {
      tab?.document.write('<p style="font:16px system-ui;padding:24px">저장 중…</p>');
    } catch {
      // about:blank 에 쓰지 못해도 동작에는 지장 없다.
    }

    setBusy(true);
    let saved = false;
    try {
      saved = await onBeforeOpen();
    } finally {
      setBusy(false);
    }

    if (!tab) return; // 팝업이 차단된 경우 — 저장은 됐고 저장 배지로 결과가 보인다
    if (saved) tab.location.href = href;
    else tab.close(); // 저장 실패 시 빈 탭을 남기지 않는다
  }

  return (
    <span className="flex items-center gap-2">
      <a
        href={href}
        onClick={handleClick}
        aria-disabled={disabled || busy}
        className={`rounded-button border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-brand ${
          disabled || busy ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        {busy ? '저장 중…' : '미리보기 ↗'}
      </a>
      <span className="text-xs text-muted">저장 후 새 탭에서 열립니다</span>
    </span>
  );
}
