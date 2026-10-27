import { describe, expect, it } from 'vitest';
import { planVideo, VIDEO_TARGET, type VideoPlan } from './video-plan';

// 실제 블로그 영상 측정값(2026-10-27): 41개 중 33개가 4K·120fps·HEVC, 평균 12.7초·44MB
const goPro4k = { codec: 'hevc', width: 3840, height: 2160, fps: 119.88, bytes: 51_675_727, duration: 11.19 };

/** 줄이는 계획만 꺼낸다(아니면 테스트 실패). */
function compressed(p: VideoPlan) {
  if (!p.compress) throw new Error('compress 계획이 아님');
  return p;
}

describe('planVideo — 업로드 전에 줄일지·어떻게 줄일지', () => {
  it('4K·120fps·HEVC → 1920x1080·30fps·H.264 로 줄인다', () => {
    expect(planVideo(goPro4k)).toEqual({ compress: true, width: 1920, height: 1080, frameRate: 30 });
  });

  it('세로 영상은 긴 변(세로)을 1920 으로', () => {
    expect(planVideo({ ...goPro4k, width: 2160, height: 3840 })).toMatchObject({ width: 1080, height: 1920 });
  });

  it('크기는 짝수로 맞춘다(H.264 인코더 요구)', () => {
    const p = compressed(planVideo({ ...goPro4k, width: 2880, height: 1620 + 1 }));
    expect(p.width % 2).toBe(0);
    expect(p.height % 2).toBe(0);
  });

  it('이미 웹용(1080p 이하·30fps·H.264·적당한 용량)이면 그대로 올린다', () => {
    expect(planVideo({ codec: 'avc', width: 1920, height: 1080, fps: 29.97, bytes: 6_000_000, duration: 12 })).toEqual({
      compress: false
    });
  });

  it('H.264 여도 용량이 과하면(초당 비트가 목표의 2배 초과) 줄인다 — 크기·프레임은 유지', () => {
    const heavy = { codec: 'avc', width: 1920, height: 1080, fps: 30, bytes: 30_000_000, duration: 10 }; // 24Mbps
    expect(planVideo(heavy)).toEqual({ compress: true, width: 1920, height: 1080, frameRate: undefined });
  });

  it('HEVC 는 작아도 H.264 로 바꾼다 — 일부 브라우저가 HEVC 를 재생하지 못한다', () => {
    expect(planVideo({ codec: 'hevc', width: 1280, height: 720, fps: 30, bytes: 3_000_000, duration: 10 })).toEqual({
      compress: true,
      width: 1280,
      height: 720,
      frameRate: undefined
    });
  });

  it('프레임 수가 30을 넘을 때만 30으로 낮춘다(24·25·30 은 유지)', () => {
    expect(compressed(planVideo({ ...goPro4k, fps: 60 })).frameRate).toBe(30);
    expect(compressed(planVideo({ ...goPro4k, fps: 24 })).frameRate).toBeUndefined();
  });

  it('정보를 못 읽으면(길이 0·크기 0) 그대로 올린다 — 확실할 때만 손댄다', () => {
    expect(planVideo({ ...goPro4k, width: 0, height: 0 })).toEqual({ compress: false });
    expect(planVideo({ ...goPro4k, duration: 0 })).toEqual({ compress: false });
  });

  it('목표 사양은 1080p·30fps·4Mbps', () => {
    expect(VIDEO_TARGET).toEqual({ maxLongSide: 1920, maxFps: 30, bitrate: 4_000_000 });
  });
});
