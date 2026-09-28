import { z } from 'zod';

/**
 * 투어 공통 안내 — 환불·안전 규정처럼 여러 투어에 똑같이 붙는 글을 한 곳에서 관리한다.
 * site_content `tour_notices`(ko) / `tour_notices:{en|ja}` 에 저장. 범용 순수 모듈.
 *
 * 투어는 TourDetail.notices 에 켜 둔 id 만 표시한다(기본 전부 끔 → 켜기 전엔 화면 변화 없음).
 * 켠 공통 안내와 같은 주제의 본문 섹션(예: ★환불 규정★)은 중복을 막기 위해 숨긴다.
 *
 * 언어 폴백: 다른 콘텐츠와 달리 한국어 저장값으로 폴백하지 않고 **그 언어의 기본 문구**를 쓴다
 * (영어 페이지에 한국어 규정이 보이는 것을 막기 위해).
 */

export const TOUR_NOTICE_IDS = ['refund', 'safety'] as const;
export type TourNoticeId = (typeof TOUR_NOTICE_IDS)[number];

export const TourNoticeSchema = z.object({
  title: z.string().default(''),
  body: z.string().default('')
});
export type TourNotice = z.infer<typeof TourNoticeSchema>;
export type TourNotices = Record<TourNoticeId, TourNotice>;

type NoticeLocale = 'ko' | 'en' | 'ja';

/** 본문 섹션 제목이 이 공통 안내와 같은 주제인지 판별. */
const NOTICE_TOPIC: Record<TourNoticeId, RegExp> = {
  refund: /환불|위약|취소|refund|cancel|penalt|返金|キャンセル|違約/i,
  safety: /안전|safety|health|安全/i
};

/**
 * 기본 문구 — 2026-09 운영 본문(푸른동굴 체험다이빙)의 환불·안전 규정 원문.
 * en/ja 환불 규정은 기존 번역 본문에 없어서 새로 번역한 것 → 켜기 전에 원님 검토 필요.
 */
export const TOUR_NOTICE_DEFAULTS: Record<NoticeLocale, TourNotices> = {
  ko: {
    refund: {
      title: '환불 · 위약금 규정',
      body: [
        '- 오키니티에 의한 취소(바다 상태 및 기상악화에 의한 안전상의 이유 등)는 예약금 전액 100% 환불 됩니다.',
        '',
        '고객 변심 또는 개인 사정으로 인한 취소',
        '*투어 7일전 : 예약금 100% 환불',
        '*투어 6~3일전 : 예약금 50% 환불',
        '*투어 2일전~당일취소 : 예약금 환불 불가',
        '*모든 환불은 영업일 기준으로 처리됩니다.',
        '',
        '환불 불가 및 위약금 배상 안내',
        '1. 예약 신청시 건강 체크리스트를 확인하지 않으셨거나 위반사항이 있음에도 숨기는경우, 해당 인원의 투어 참여가 불가능하며 당일 투어 요금 100%가 위약금으로 청구됩니다.',
        '안전한 투어를 위해 반드시 확인 부탁드립니다.',
        '2. 픽업, 집합시간에 도착하지 못하시는 경우 노쇼로 처리되며 이때에는 예약금이 환불되지 않습니다.',
        '3. 투어 전날 과도한 음주 또는 컨디션 조절불가로 당일 투어진행이 어렵다고 판단되는 경우 투어는 즉시 중단되며 투어비용 전액이 청구되거나 투어비용 환불이 불가합니다.',
        '4. 동행하는 다른팀 또는 동승하는 타샵의 게스트에게 위협 또는 폭언,폭행을 가하는 경우 그 즉시 투어가 중지되며 투어비용 환불이 불가합니다.',
        '5. 오키니티에서 렌탈하신 장비를 분실 또는 파손하신 경우 해당장비를 배상하셔야 합니다.(새제품 기준 비용 청구)'
      ].join('\n')
    },
    safety: {
      title: '안전관리 안내',
      body: [
        '만 55세(2026년기준 1971년생) 이상 참가자는 투어 당일 미팅 장소에서 혈압 측정 및 추가적 메디컬 체크 시트 작성을 진행합니다.',
        'BMI가 높거나 체격이 큰 참가자의 경우, 안전을 위해 투어 전 혈압 측정 등 기본 건강 체크를 요청할 수 있습니다.',
        '혈압 측정 결과가 2회 연속으로 130mmHg를 초과할 경우, 안전상의 이유로 투어 참가가 제한됩니다. 이 경우 투어 전 메디컬체크 허위작성과 당일 취소로 간주되어 환불이 어렵습니다.'
      ].join('\n')
    }
  },
  en: {
    refund: {
      title: 'Cancellation & Refund Policy',
      body: [
        '- Cancellations made by OKINITY (for safety reasons such as sea or weather conditions) receive a full 100% refund of the deposit.',
        '',
        'Cancellations for personal reasons',
        '*7 days before the tour : 100% of the deposit refunded',
        '*6–3 days before the tour : 50% of the deposit refunded',
        '*2 days before or tour day : No refund of the deposit',
        '*All refunds are processed on a business-day basis.',
        '',
        'Non-refundable cases and penalties',
        '1. If you did not review the health checklist when booking, or hid a condition that applies to you, you will not be able to join the tour and 100% of that day’s tour fee will be charged as a penalty.',
        'Please be sure to review it for a safe tour.',
        '2. If you do not arrive by the pickup or meeting time, it is treated as a no-show and the deposit is not refunded.',
        '3. If heavy drinking the night before or poor condition makes it unsafe to proceed on the day, the tour will be stopped immediately and the full tour fee will be charged or will not be refunded.',
        '4. If you threaten, verbally abuse or assault guests of another team or another shop on board, the tour will be stopped immediately and the tour fee will not be refunded.',
        '5. If you lose or damage equipment rented from OKINITY, you will be asked to compensate for it (charged at the price of a new item).'
      ].join('\n')
    },
    safety: {
      title: 'Health & Safety Notice',
      body: [
        'Participants aged 55 and older (born in or before 1971, as of 2026) will have their blood pressure measured and complete an additional medical check sheet at the meeting point on the day of the tour.',
        'Participants with a high BMI or a larger build may be asked to complete a basic health check, such as a blood pressure measurement, before the tour for safety reasons.',
        'If blood pressure exceeds 130 mmHg on two consecutive readings, participation in the tour will be restricted for safety reasons. In this case, it is treated as a falsified pre-tour medical questionnaire and a same-day cancellation, and no refund can be given.'
      ].join('\n')
    }
  },
  ja: {
    refund: {
      title: 'キャンセル・返金規定',
      body: [
        '- オキニティ都合によるキャンセル（海況や悪天候など安全上の理由）は、予約金を100%返金いたします。',
        '',
        'お客様のご都合によるキャンセル',
        '＊ツアー7日前まで：予約金100%返金',
        '＊ツアー6〜3日前：予約金50%返金',
        '＊ツアー2日前〜当日：予約金の返金不可',
        '＊返金はすべて営業日基準で処理いたします。',
        '',
        '返金不可および違約金について',
        '1. ご予約時に健康チェックリストをご確認いただかなかった場合、または該当事項があるにもかかわらず申告されなかった場合、該当の方はツアーにご参加いただけず、当日のツアー料金の100%を違約金として申し受けます。',
        '安全なツアーのため、必ずご確認ください。',
        '2. ピックアップ・集合時間に遅れた場合はノーショーとなり、予約金は返金されません。',
        '3. 前日の過度な飲酒や体調不良により当日のツアー実施が難しいと判断した場合、ツアーは直ちに中止となり、ツアー料金の全額を申し受けるか、ツアー料金の返金はいたしかねます。',
        '4. 同行する他チームや同乗する他店のゲストに対して威嚇・暴言・暴力があった場合、直ちにツアーを中止し、ツアー料金は返金いたしかねます。',
        '5. オキニティでレンタルした器材を紛失・破損された場合は、新品価格にて弁償いただきます。'
      ].join('\n')
    },
    safety: {
      title: '安全管理について',
      body: [
        '55歳（2026年基準：1971年生まれ）以上の参加者の方は、ツアー当日、集合場所にて血圧測定および追加のメディカルチェックシートのご記入を行います。',
        'BMIが高い方や体格の大きい方には、安全のためツアー前に血圧測定などの基本的な健康チェックをお願いする場合があります。',
        '血圧測定の結果が2回連続で130mmHgを超えた場合、安全上の理由によりツアーへのご参加が制限されます。この場合、ツアー前のメディカルチェックシートの虚偽記載および当日キャンセルとみなされ、返金はいたしかねます。'
      ].join('\n')
    }
  }
};

function noticeLocale(locale: string): NoticeLocale {
  return locale === 'en' || locale === 'ja' ? locale : 'ko';
}

/** 저장값(그 언어 키) 해석 — 비었거나 깨진 항목은 그 언어의 기본 문구. */
export function parseTourNotices(raw: unknown, locale: string): TourNotices {
  const defaults = TOUR_NOTICE_DEFAULTS[noticeLocale(locale)];
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out = {} as TourNotices;
  for (const id of TOUR_NOTICE_IDS) {
    const parsed = TourNoticeSchema.safeParse(obj[id] ?? {});
    const v = parsed.success ? parsed.data : { title: '', body: '' };
    out[id] = v.title.trim() && v.body.trim() ? v : defaults[id];
  }
  return out;
}

/** 투어에 켜 둔 id 중 알려진 것만, 정의 순서대로(중복 제거). */
export function activeNoticeIds(ids: readonly string[]): TourNoticeId[] {
  return TOUR_NOTICE_IDS.filter((id) => ids.includes(id));
}

/** 이 본문 섹션을 켜 둔 공통 안내가 대신하는지(→ 본문 섹션 숨김). */
export function sectionCoveredByNotice(title: string, active: readonly TourNoticeId[]): boolean {
  return active.some((id) => NOTICE_TOPIC[id].test(title));
}
