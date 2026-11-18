import { GEO_PLATFORM_GUIDE, GEO_PLATFORMS } from '@/lib/geo-checks';

/**
 * AI 답변 기록 매뉴얼 — 어드민 "AI 노출" 화면에 접어 두는 안내(첫 기록 전에는 펼쳐 둠).
 * 원님 요청(2026-11-18): "어드민에 뭐라고 질문하면 되는지 매뉴얼을 걸어놔줘".
 * 플랫폼별 방법은 lib/geo-checks GEO_PLATFORM_GUIDE 하나로 관리(기록 화면과 공유).
 */
export default function GeoManual({ open }: { open: boolean }) {
  const h = 'mt-4 text-sm font-bold text-ink';
  const li = 'leading-relaxed';
  return (
    <details open={open} className="mt-3 rounded-card border border-sky-200 bg-sky-50/60 p-4 text-sm text-ink">
      <summary className="cursor-pointer font-bold text-sky-800">기록 매뉴얼 — 처음이면 먼저 읽어 주세요</summary>

      <p className={h}>1. 무엇을 하나요?</p>
      <p className={li}>
        어드민에 질문하는 게 아니라, 아래 <b>기록하기</b>에 있는 질문 10개를 <b>[질문 복사]</b>로 복사해 각 AI에 그대로
        물어보고, 답에 오키니티가 나왔는지 체크해 저장합니다.
      </p>

      <p className={h}>2. 언제·얼마나</p>
      <ul className="list-disc space-y-1 pl-5">
        <li className={li}>
          <b>매달 1번</b>, 첫째 주 중 하루. 플랫폼 4개 × 질문 10개 ≈ 40분.
        </li>
        <li className={li}>
          매주 할 필요는 없어요. AI 답은 날마다 조금씩 흔들려서, 한 달에 한 번 <b>같은 날 4개 플랫폼을 한꺼번에</b> 묻는
          쪽이 달마다 비교하기에 더 정확합니다.
        </li>
        <li className={li}>휴대폰도 되지만 컴퓨터가 편해요(질문 복사·붙여넣기).</li>
      </ul>

      <p className={h}>3. 꼭 지킬 것</p>
      <ul className="list-disc space-y-1 pl-5">
        <li className={li}>질문은 글자 하나도 바꾸지 않습니다 — 바꾸면 지난달과 비교가 안 돼요.</li>
        <li className={li}>질문마다 새 대화(새 검색)로 묻습니다 — 앞 질문의 답이 섞이지 않게.</li>
        <li className={li}>플랫폼 하나를 끝낼 때마다 <b>[기록 저장]</b>을 누릅니다.</li>
      </ul>

      <p className={h}>4. 플랫폼별 묻는 방법</p>
      <div className="mt-1 grid gap-3 md:grid-cols-2">
        {GEO_PLATFORMS.map((p) => (
          <div key={p} className="rounded-card border border-line bg-surface p-3">
            <p className="font-semibold">{p}</p>
            <p className="text-xs text-muted">{GEO_PLATFORM_GUIDE[p].where}</p>
            <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px]">
              {GEO_PLATFORM_GUIDE[p].steps.map((s) => (
                <li key={s} className={li}>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className={h}>5. 체크 기준</p>
      <ul className="list-disc space-y-1 pl-5">
        <li className={li}>
          <b>언급</b> — 답에 &lsquo;오키니티&rsquo;·&lsquo;OKINITY&rsquo;·&lsquo;포뇨강사&rsquo;·&lsquo;허범영 대표&rsquo; 중 하나라도
          나오면.
        </li>
        <li className={li}>
          <b>출처(링크)</b> — 답의 출처·링크에 <b>okinity.com</b> 이 있으면. 체크하면 주소 칸이 나오니 그 링크를
          붙여넣으세요. 인스타그램·네이버 블로그 등 우리 다른 채널이 출처면 체크하지 말고 메모에 적어 주세요.
        </li>
        <li className={li}>
          <b>추천</b> — 추천 업체·순위·목록 안에 오키니티가 들어가면. 이름만 지나가듯 나오면 &lsquo;언급&rsquo;만 체크.
        </li>
        <li className={li}>
          <b>함께 나온 업체</b> — 답에 나온 다른 업체 이름(3개까지). 오키니티가 안 나와도 적어 주세요 — AI가 누구를
          대신 추천하는지가 중요한 정보예요.
        </li>
        <li className={li}>
          <b>메모</b> — 틀린 정보(가격·위치·투어 내용·운영 여부 등)나 &lsquo;AI 개요 없음&rsquo; 같은 상황.
        </li>
      </ul>

      <p className={h}>6. 이런 때는</p>
      <ul className="list-disc space-y-1 pl-5">
        <li className={li}>
          <b>AI 개요·AI 브리핑이 안 나올 때</b> — 체크 없이 메모에 &ldquo;안 나옴&rdquo;만 적고 다음 질문으로.
        </li>
        <li className={li}>
          <b>오키니티에 대한 틀린 정보를 봤을 때</b> — 메모에 적고 Claude에게 알려 주세요. 사이트 내용을 보강해 바로잡습니다.
        </li>
        <li className={li}>
          <b>저장한 뒤 고치고 싶을 때</b> — 같은 날짜·플랫폼을 다시 고르면 저장한 내용이 불러와져요. 고친 뒤 저장하면
          덮어씁니다.
        </li>
        <li className={li}>
          <b>저장 전에 다른 플랫폼을 눌렀을 때</b> — 입력한 내용은 남아 있어요(주황 점 ● = 저장 안 함).
        </li>
      </ul>

      <p className={h}>7. 결과 보는 법</p>
      <p className={li}>
        위 <b>월별</b> 표의 숫자는 &ldquo;언급 · 출처 · 추천 / 물어본 질문 수&rdquo;입니다. 달마다 언급·출처가 늘면 GEO
        작업이 효과를 내고 있다는 뜻이에요. 질문별 표에서 마우스를 올리면 메모가 보입니다.
      </p>
    </details>
  );
}
