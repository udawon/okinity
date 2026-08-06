/**
 * 초안 미리보기 배너 — 어드민에게만 보이는 비공개 글임을 명확히 알린다.
 * 이게 없으면 관리자가 "이미 공개된 글"로 착각할 수 있다.
 */
export default function DraftNotice({ editHref }: { editHref: string }) {
  return (
    <div className="mb-8 rounded-card border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
      <strong className="font-semibold">초안 미리보기</strong> — 아직 공개되지 않은 글입니다.
      방문객에게는 보이지 않습니다.{' '}
      <a href={editHref} className="underline underline-offset-2 hover:text-white">
        편집 화면으로
      </a>
    </div>
  );
}
