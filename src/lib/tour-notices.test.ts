import { describe, expect, it } from 'vitest';
import {
  TOUR_NOTICE_DEFAULTS,
  activeNoticeIds,
  parseTourNotices,
  sectionCoveredByNotice
} from './tour-notices';

describe('parseTourNotices', () => {
  it('저장값이 없으면 해당 언어의 기본 문구', () => {
    expect(parseTourNotices(null, 'ko')).toEqual(TOUR_NOTICE_DEFAULTS.ko);
    expect(parseTourNotices(undefined, 'ja')).toEqual(TOUR_NOTICE_DEFAULTS.ja);
  });

  it('저장된 항목은 저장값, 빈 항목은 기본 문구로 채운다', () => {
    const r = parseTourNotices({ refund: { title: '새 제목', body: '새 본문' }, safety: { title: '', body: '' } }, 'ko');
    expect(r.refund).toEqual({ title: '새 제목', body: '새 본문' });
    expect(r.safety).toEqual(TOUR_NOTICE_DEFAULTS.ko.safety);
  });

  it('형식이 깨진 값은 기본 문구', () => {
    expect(parseTourNotices('garbage', 'en')).toEqual(TOUR_NOTICE_DEFAULTS.en);
  });

  it('모든 언어 기본 문구에 제목과 본문이 있다', () => {
    for (const loc of ['ko', 'en', 'ja'] as const) {
      for (const id of ['refund', 'safety'] as const) {
        expect(TOUR_NOTICE_DEFAULTS[loc][id].title.length).toBeGreaterThan(0);
        expect(TOUR_NOTICE_DEFAULTS[loc][id].body.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('activeNoticeIds', () => {
  it('알려진 id만 순서대로 남긴다', () => {
    expect(activeNoticeIds(['safety', 'unknown', 'refund', 'refund'])).toEqual(['refund', 'safety']);
    expect(activeNoticeIds([])).toEqual([]);
  });
});

describe('sectionCoveredByNotice', () => {
  it('공통 안내를 켜면 같은 주제의 본문 섹션은 가려진다', () => {
    expect(sectionCoveredByNotice('환불 규정', ['refund'])).toBe(true);
    expect(sectionCoveredByNotice('Health & Safety Notice', ['safety'])).toBe(true);
    expect(sectionCoveredByNotice('安全管理について', ['safety'])).toBe(true);
    expect(sectionCoveredByNotice('환불 규정', ['safety'])).toBe(false);
    expect(sectionCoveredByNotice('투어 안내', ['refund', 'safety'])).toBe(false);
  });
});
