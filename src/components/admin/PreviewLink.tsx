/**
 * 미리보기 버튼 — 공개 페이지를 새 탭으로 연다.
 * 초안(비공개)도 어드민 로그인 상태에서는 열린다(lib/admin-preview).
 *
 * 열리는 것은 "마지막으로 저장된" 내용이다. 편집 중인 미저장 변경은 반영되지 않으므로
 * 저장 후 누르도록 안내 문구를 함께 둔다.
 */
export default function PreviewLink({ href }: { href: string }) {
  return (
    <span className="flex items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="rounded-button border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-brand"
      >
        미리보기 ↗
      </a>
      <span className="text-xs text-muted">저장한 내용으로 열립니다</span>
    </span>
  );
}
