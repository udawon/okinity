/**
 * 예약 문의 보내기 직전 단계(가예약 확인) — 순수 로직.
 *
 * 흐름: [보내기] → (다이빙·스노클링·PADI는 메디컬 체크) → 가예약 확인 팝업 → [확인하고 보내기] → 전송.
 * 메디컬 체크는 한 번 마치면 폼을 초기화할 때까지 기억한다 — 가예약 팝업에서 "수정하기"로 돌아가
 * 날짜·인원을 고친 뒤 다시 보내도 6개 영역을 다시 체크하지 않게.
 */

export type SubmitStep = 'medical' | 'confirm';

/** 보내기를 눌렀을 때 열 팝업. */
export function nextSubmitStep(needsMedical: boolean, medicalDone: boolean): SubmitStep {
  return needsMedical && !medicalDone ? 'medical' : 'confirm';
}

/**
 * 문의 기록에 "메디컬 체크 완료" 표시를 붙일지 — 지금 고른 투어가 메디컬 체크 대상이고 체크를 마쳤을 때만.
 * (다이빙에서 체크를 마친 뒤 낚시로 바꿔 보내면 붙이지 않는다)
 */
export function sendsMedicalMarker(needsMedical: boolean, medicalDone: boolean): boolean {
  return needsMedical && medicalDone;
}

export type SummaryField = 'date' | 'tour' | 'time' | 'people' | 'email' | 'contact';
export type SummaryRow = { field: SummaryField; value: string };

/**
 * 손님 언어 투어 이름 — 종류 · 세부 프로그램 · 클래스/옵션을 " · "로 잇고 빈 칸은 건너뛴다.
 * (가예약 팝업 요약과 완료 화면이 함께 쓴다. 운영자용 한국어 기록값 product 와는 별개)
 */
export function joinTourLabel(parts: (string | undefined)[]): string {
  return parts
    .map((s) => s?.trim() ?? '')
    .filter(Boolean)
    .join(' · ');
}

/** 운영자가 읽는 시간대 고정값(폼이 그대로 전송) — 요약에서는 손님 언어 라벨로 바꿔 보여 준다. */
const TIME_ASK_VALUE = '개별 문의';

/**
 * 가예약 확인 팝업의 입력 내용 요약 — 날짜·투어·시간대·인원·이메일·연락처 순.
 * 값은 이미 손님 언어로 만든 표시용 문자열을 받는다. 빈 값(공백만 포함)인 줄은 뺀다.
 */
export function bookingSummaryRows(input: {
  dateLabel: string;
  /** 투어 종류 · 세부 프로그램 · 클래스/옵션 — 빈 칸은 건너뛰고 " · "로 잇는다. */
  tour: (string | undefined)[];
  time: string;
  people: string;
  email: string;
  contact: string;
  /** '개별 문의'를 대신할 손님 언어 라벨. */
  timeAskLabel: string;
}): SummaryRow[] {
  const time = input.time.trim();
  const rows: SummaryRow[] = [
    { field: 'date', value: input.dateLabel.trim() },
    { field: 'tour', value: joinTourLabel(input.tour) },
    { field: 'time', value: time === TIME_ASK_VALUE ? input.timeAskLabel : time },
    { field: 'people', value: input.people.trim() },
    { field: 'email', value: input.email.trim() },
    { field: 'contact', value: input.contact.trim() }
  ];
  return rows.filter((r) => r.value !== '');
}
