import { describe, expect, it } from 'vitest';
import { parseTourBody, splitRow, isRuleSection, type BodyBlock } from './tour-body';

const blocksOf = (body: string) => parseTourBody(body);

describe('parseTourBody — 섹션', () => {
  it('★제목★ 앞 내용은 intro, 이후는 제목별 섹션으로 나눈다', () => {
    const r = blocksOf('첫 소개 문장입니다.\n\n★투어 안내★\n*항목 하나\n\n★ 다이빙 포인트 안내 ★\n설명');
    expect(r.intro).toEqual([{ type: 'paragraph', lines: ['첫 소개 문장입니다.'] }]);
    expect(r.sections.map((s) => s.title)).toEqual(['투어 안내', '다이빙 포인트 안내']);
    expect(r.sections[0].blocks).toEqual([{ type: 'list', ordered: false, items: ['항목 하나'] }]);
  });

  it('빈 본문은 빈 결과', () => {
    expect(blocksOf('')).toEqual({ intro: [], sections: [] });
    expect(blocksOf('  \n \n')).toEqual({ intro: [], sections: [] });
  });

  it('줄바꿈(\\r\\n)도 처리한다', () => {
    const r = blocksOf('첫 문장입니다.\r\n둘째 문장입니다.');
    expect(r.intro).toEqual([{ type: 'paragraph', lines: ['첫 문장입니다.', '둘째 문장입니다.'] }]);
  });
});

describe('parseTourBody — 목록', () => {
  it('* 목록 다음의 표시 없는 줄은 앞 항목에 이어 붙인다(연속 줄)', () => {
    const r = blocksOf('*지각하시는 경우 기다리지 않고 출발하며\n해당 투어는 노쇼 처리됩니다.\n*두 번째');
    expect(r.intro).toEqual([
      {
        type: 'list',
        ordered: false,
        items: ['지각하시는 경우 기다리지 않고 출발하며\n해당 투어는 노쇼 처리됩니다.', '두 번째']
      }
    ]);
  });

  it('- 로 시작하는 줄도 목록 항목이다', () => {
    const r = blocksOf('- 오키니티에 의한 취소는 100% 환불\n-고객 변심으로 인한 취소');
    expect(r.intro).toEqual([
      { type: 'list', ordered: false, items: ['오키니티에 의한 취소는 100% 환불', '고객 변심으로 인한 취소'] }
    ]);
  });

  it('숫자. 로 시작하면 번호 목록, 연속 줄 포함', () => {
    const r = blocksOf('1. 첫째 규정\n반드시 확인 부탁드립니다.\n2. 둘째 규정');
    expect(r.intro).toEqual([
      { type: 'list', ordered: true, items: ['첫째 규정\n반드시 확인 부탁드립니다.', '둘째 규정'] }
    ]);
  });

  it('목록 바로 앞의 짧은 제목형 줄은 소제목이 된다', () => {
    const r = blocksOf('환불 불가 및 위약금 배상 안내\n1. 첫째\n2. 둘째');
    expect(r.intro[0]).toEqual({ type: 'subhead', text: '환불 불가 및 위약금 배상 안내' });
    expect(r.intro[1]).toMatchObject({ type: 'list', ordered: true });
  });

  it('문장으로 끝나는 줄은 목록 앞이어도 소제목으로 보지 않는다', () => {
    const r = blocksOf('아래 내용을 확인해 주세요.\n*항목');
    expect(r.intro[0]).toEqual({ type: 'paragraph', lines: ['아래 내용을 확인해 주세요.'] });
  });

  it('준비물·지참 섹션의 일반 줄은 목록으로 바꾼다', () => {
    const r = blocksOf('★필수 지참★\n투어 중 마실 음료(물, 음료, 주류 모두 OK)\n선크림 및 자외선 차단 제품(얇은 긴팔, 모자, 선글라스 등을 필수로 지참해주시기 바랍니다.)');
    expect(r.sections[0].blocks).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [
          '투어 중 마실 음료(물, 음료, 주류 모두 OK)',
          '선크림 및 자외선 차단 제품(얇은 긴팔, 모자, 선글라스 등을 필수로 지참해주시기 바랍니다.)'
        ]
      }
    ]);
  });

  it('짧은 줄 여러 개로 된 문단은 목록으로 바꾼다(교육 일정 등)', () => {
    const r = blocksOf('@1일차\n제한수역 교육(2dive)\n디브리핑\n오픈워터 이론 교육');
    expect(r.intro).toEqual([
      { type: 'subhead', text: '1일차' },
      { type: 'list', ordered: false, items: ['제한수역 교육(2dive)', '디브리핑', '오픈워터 이론 교육'] }
    ]);
  });

  it('긴 문장이 섞인 문단은 그대로 둔다', () => {
    const r = blocksOf('오전 08:00 부터 12:00까지 중\n원하는 시간 언제든지 출발이 가능합니다.');
    expect(r.intro).toEqual([
      { type: 'paragraph', lines: ['오전 08:00 부터 12:00까지 중', '원하는 시간 언제든지 출발이 가능합니다.'] }
    ]);
  });
});

describe('parseTourBody — 강조 표기', () => {
  it('!…! 는 경고 박스', () => {
    const r = blocksOf('!현장에서 연령확인 후 참여가 불가하면 환불이 불가합니다.!');
    expect(r.intro).toEqual([
      { type: 'callout', tone: 'warn', text: '현장에서 연령확인 후 참여가 불가하면 환불이 불가합니다.' }
    ]);
  });

  it('@짧은글 은 소제목, @긴글 은 안내 박스', () => {
    const r = blocksOf('@2일차\n\n@프리미엄 포토서비스를 구매해주시는 분들께는 수제 기념품 1개를 증정합니다.(수량한정)');
    expect(r.intro).toEqual([
      { type: 'subhead', text: '2일차' },
      { type: 'callout', tone: 'note', text: '프리미엄 포토서비스를 구매해주시는 분들께는 수제 기념품 1개를 증정합니다.(수량한정)' }
    ]);
  });

  it('-미들클래스- 처럼 양끝 대시는 소제목', () => {
    const r = blocksOf('-미들클래스-\n최대 5인까지 130,000엔');
    expect(r.intro[0]).toEqual({ type: 'subhead', text: '미들클래스' });
  });
});

describe('parseTourBody — 일본어 전각 기호', () => {
  it('＊ 목록, ！…！ 경고, ＠ 소제목을 인식한다', () => {
    const r = blocksOf('＊ご参加いただける年齢は10歳から55歳までです。\n！必ずご確認ください！\n＠1日目');
    expect(r.intro).toEqual([
      { type: 'list', ordered: false, items: ['ご参加いただける年齢は10歳から55歳までです。'] },
      { type: 'callout', tone: 'warn', text: '必ずご確認ください' },
      { type: 'subhead', text: '1日目' }
    ]);
  });
});

describe('parseTourBody — 표(행)', () => {
  it('"이름 : 값" 줄이 이어지면 표로 묶는다', () => {
    const r = blocksOf('케라마 제도 : 2회 23,000엔 / 3회 25,000엔\nUSS 에몬즈 : 2회 27,000엔');
    expect(r.intro).toEqual([
      {
        type: 'rows',
        rows: [
          { label: '케라마 제도', value: '2회 23,000엔 / 3회 25,000엔' },
          { label: 'USS 에몬즈', value: '2회 27,000엔' }
        ]
      }
    ]);
  });

  it('"설명 금액엔" 으로 끝나는 줄도 표 행이다', () => {
    const r = blocksOf('최대 5인까지 130,000엔\n5인~11인까지 150,000엔');
    expect(r.intro).toEqual([
      {
        type: 'rows',
        rows: [
          { label: '최대 5인까지', value: '130,000엔' },
          { label: '5인~11인까지', value: '150,000엔' }
        ]
      }
    ]);
  });

  it('시각(09:00 / 11:30)은 표로 오인하지 않는다', () => {
    const r = blocksOf('09:00 / 11:30 / 14:00');
    expect(r.intro).toEqual([{ type: 'paragraph', lines: ['09:00 / 11:30 / 14:00'] }]);
  });

  it('전각 콜론(：)도 인식한다', () => {
    const r = blocksOf('ケラマ諸島：2本 23,000円');
    expect(r.intro).toEqual([{ type: 'rows', rows: [{ label: 'ケラマ諸島', value: '2本 23,000円' }] }]);
  });
});

describe('parseTourBody — 진행 흐름', () => {
  it('화살표(->)가 2개 이상인 줄은 단계로 나누고 괄호 속 시간을 분리한다', () => {
    const r = blocksOf('기본적인 투어 흐름은\n지정장소 집합 -> 수트환복과 투어설명(약30분) -> 보트이동(약7분)\n의 순서로 총 소요시간은 최대 약 2시간 입니다.');
    const steps = r.intro.find((b): b is Extract<BodyBlock, { type: 'steps' }> => b.type === 'steps');
    expect(steps?.steps).toEqual([
      { name: '지정장소 집합', time: '' },
      { name: '수트환복과 투어설명', time: '약 30분' },
      { name: '보트이동', time: '약 7분' }
    ]);
    // 앞뒤 연결 문장은 버리지 않고 문단으로 남긴다(원문 손실 없음)
    expect(r.intro[0]).toEqual({ type: 'paragraph', lines: ['기본적인 투어 흐름은'] });
    expect(r.intro[2]).toEqual({ type: 'paragraph', lines: ['의 순서로 총 소요시간은 최대 약 2시간 입니다.'] });
  });

  it('전각 화살표(→)·전각 괄호도 인식한다', () => {
    const r = blocksOf('集合 → 昼食（半日コースは昼食なし） → 帰港');
    expect(r.intro[0]).toEqual({
      type: 'steps',
      steps: [
        { name: '集合', time: '' },
        { name: '昼食', time: '半日コースは昼食なし' },
        { name: '帰港', time: '' }
      ]
    });
  });

  it('화살표가 1개뿐인 줄은 일반 문장', () => {
    const r = blocksOf('공항 -> 숙소 픽업 가능');
    expect(r.intro).toEqual([{ type: 'paragraph', lines: ['공항 -> 숙소 픽업 가능'] }]);
  });
});

describe('parseTourBody — 원문 보존', () => {
  it('모든 비어 있지 않은 줄의 글자가 결과 어딘가에 남는다', () => {
    const body = [
      '소개',
      '',
      '★투어 안내★',
      '*항목',
      '이어지는 줄',
      '!경고!',
      '@노트가 충분히 길어서 안내 박스로 바뀌는 문장입니다',
      '가격 : 1,000엔',
      'A -> B -> C',
      '1. 규정',
      '-소제목-'
    ].join('\n');
    const flat = JSON.stringify(parseTourBody(body));
    for (const word of ['소개', '투어 안내', '항목', '이어지는 줄', '경고', '노트가', '가격', '1,000엔', 'A', 'C', '규정', '소제목']) {
      expect(flat).toContain(word);
    }
  });
});

describe('splitRow', () => {
  it('목록 항목 속 "이름 : 값" 을 분리한다', () => {
    expect(splitRow('투어 7일전 : 예약금 100% 환불')).toEqual({ label: '투어 7일전', value: '예약금 100% 환불' });
    expect(splitRow('콜론 없는 문장')).toBeNull();
    expect(splitRow('09:00 출발')).toBeNull();
    expect(splitRow('2 days before or tour day : No refund of the deposit')).toEqual({
      label: '2 days before or tour day',
      value: 'No refund of the deposit'
    });
  });
});

describe('isRuleSection', () => {
  it('환불·안전·위약·규정 제목은 규정 섹션', () => {
    expect(isRuleSection('환불 규정')).toBe(true);
    expect(isRuleSection('안전관리 안내')).toBe(true);
    expect(isRuleSection('Refund Policy')).toBe(true);
    expect(isRuleSection('キャンセル規定')).toBe(true);
    expect(isRuleSection('투어 안내')).toBe(false);
  });
});
