import { describe, expect, it } from 'vitest';
import { pickActiveSection } from './section-spy';

const secs = [
  { id: 'overview', top: -400 },
  { id: 'included', top: -20 },
  { id: 's0', top: 300 },
  { id: 'rules', top: 900 }
];

describe('pickActiveSection', () => {
  it('기준선(탭 바 아래)을 지난 마지막 섹션이 현재 위치', () => {
    expect(pickActiveSection(secs, 120, false)).toBe('included');
    expect(pickActiveSection(secs, 320, false)).toBe('s0');
  });

  it('아직 어떤 섹션도 기준선을 지나지 않았으면 첫 섹션', () => {
    expect(pickActiveSection(secs.map((s) => ({ ...s, top: s.top + 1000 })), 120, false)).toBe('overview');
  });

  it('페이지 끝에 닿으면 마지막 섹션(짧은 마지막 섹션도 선택되도록)', () => {
    expect(pickActiveSection(secs, 120, true)).toBe('rules');
  });

  it('섹션이 없으면 null', () => {
    expect(pickActiveSection([], 120, false)).toBeNull();
  });
});
