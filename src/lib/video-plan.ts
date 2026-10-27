/**
 * 영상 업로드 전 압축 계획 — 범용 모듈(DOM·라이브러리 의존 없음).
 *
 * 배경(2026-10-27 실측): 블로그 영상 41개 중 33개가 4K·120fps·HEVC 원본 그대로(평균 12.7초·44MB)
 * 올라가 Supabase 무료 용량(1GB)을 넘겨 사이트가 멈췄다. 1080p·30fps·H.264 로 바꾸면 1/10 안팎.
 * HEVC 는 일부 브라우저가 재생하지 못해 H.264 로 통일한다.
 */

export const VIDEO_TARGET = { maxLongSide: 1920, maxFps: 30, bitrate: 4_000_000 } as const;

export type VideoMeta = {
  /** 코덱 식별자(mediabunny 기준 'avc' | 'hevc' | 'vp9' …). 모르면 null. */
  codec: string | null;
  /** 화면에 보이는 방향 기준 크기(회전 반영). */
  width: number;
  height: number;
  fps: number;
  bytes: number;
  /** 초 */
  duration: number;
};

export type VideoPlan =
  | { compress: false }
  | { compress: true; width: number; height: number; frameRate: number | undefined };

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** 줄일지·어떤 크기/프레임으로 줄일지. 정보를 확실히 읽었을 때만 손댄다. */
export function planVideo(m: VideoMeta): VideoPlan {
  if (!(m.width > 0 && m.height > 0 && m.duration > 0)) return { compress: false };

  const longSide = Math.max(m.width, m.height);
  const tooBig = longSide > VIDEO_TARGET.maxLongSide;
  const tooFast = m.fps > VIDEO_TARGET.maxFps + 1; // 29.97·30 은 그대로
  const tooHeavy = (m.bytes * 8) / m.duration > VIDEO_TARGET.bitrate * 2;
  const notH264 = m.codec !== 'avc';
  if (!tooBig && !tooFast && !tooHeavy && !notH264) return { compress: false };

  const scale = tooBig ? VIDEO_TARGET.maxLongSide / longSide : 1;
  return {
    compress: true,
    width: even(m.width * scale),
    height: even(m.height * scale),
    frameRate: tooFast ? VIDEO_TARGET.maxFps : undefined
  };
}
