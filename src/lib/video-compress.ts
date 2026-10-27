'use client';

import { planVideo, VIDEO_TARGET } from './video-plan';

/**
 * 영상 업로드 전 브라우저 압축 — WebCodecs(mediabunny)로 1080p·30fps·H.264 MP4 로 다시 만든다.
 * 계획은 lib/video-plan. 라이브러리는 영상을 고를 때만 불러온다(어드민 첫 화면 무게 그대로).
 *
 * 어떤 이유로든 줄이지 못하면(브라우저 미지원·변환 실패·오히려 커짐) 원본을 그대로 돌려준다 —
 * 업로드 자체를 막지 않는다. 원본이 업로드 한도(50MB)를 넘으면 그때 서버가 안내한다.
 */
export type CompressResult = { file: File; compressed: boolean; note?: string };

export async function compressVideo(file: File, onProgress?: (ratio: number) => void): Promise<CompressResult> {
  if (typeof window === 'undefined' || typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') {
    return { file, compressed: false, note: '이 브라우저는 영상 줄이기를 지원하지 않아 원본을 올립니다.' };
  }
  try {
    const mb = await import('mediabunny');
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return { file, compressed: false };

    const [duration, stats] = await Promise.all([input.computeDuration(), track.computePacketStats(120)]);
    const plan = planVideo({
      codec: track.codec,
      width: track.displayWidth,
      height: track.displayHeight,
      fps: stats.averagePacketRate,
      bytes: file.size,
      duration
    });
    if (!plan.compress) return { file, compressed: false };

    const encodable = await mb.canEncodeVideo('avc', {
      width: plan.width,
      height: plan.height,
      bitrate: VIDEO_TARGET.bitrate
    });
    if (!encodable) {
      return { file, compressed: false, note: '이 브라우저는 H.264 인코딩을 지원하지 않아 원본을 올립니다.' };
    }

    const output = new mb.Output({
      // moov 를 앞에 — 다 받기 전에 재생이 시작된다
      format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new mb.BufferTarget()
    });
    const conversion = await mb.Conversion.init({
      input,
      output,
      video: {
        codec: 'avc',
        width: plan.width,
        height: plan.height,
        fit: 'fill', // 비율은 계획에서 이미 맞췄다
        frameRate: plan.frameRate,
        // 숫자만 넘기면 0~1 품질 등급으로 해석된다 — 비트레이트는 반드시 객체로
        quality: new mb.Quality({ bitrate: VIDEO_TARGET.bitrate, bitrateMode: 'variable' }),
        forceTranscode: true
      },
      // 오디오는 기본값 — MP4 에 그대로 담을 수 있으면 복사, 아니면 변환(불가하면 소리 없이)
      // 촬영 정보는 비운다 — 기본값은 원본 태그 복사라 아이폰 영상의 촬영 위치(GPS)가 공개될 수 있다
      tags: {}
    });
    // 이 브라우저가 원본 코덱(예: HEVC)을 풀지 못하면 영상 트랙을 버리고 '소리만 남은' 파일로
    // 성공 처리된다(2026-10-27 실측, Chromium). 영상이 빠지면 반드시 원본으로.
    if (!conversion.isValid || !conversion.utilizedTracks.some((t) => t.isVideoTrack())) {
      return { file, compressed: false, note: '이 브라우저가 영상 형식을 풀지 못해 원본을 올립니다.' };
    }
    conversion.onProgress = (p) => onProgress?.(p);
    await conversion.execute();

    const buffer = output.target.buffer;
    if (!buffer || buffer.byteLength >= file.size) return { file, compressed: false };
    // 결과물에 영상이 실제로 들어 있는지 한 번 더 확인(소리만 남은 파일을 올리지 않게)
    const check = new mb.Input({ source: new mb.BufferSource(buffer), formats: mb.ALL_FORMATS });
    if (!(await check.getPrimaryVideoTrack())) {
      return { file, compressed: false, note: '줄인 영상에 화면이 없어 원본을 올립니다.' };
    }
    const name = `${file.name.replace(/\.[^.]+$/, '') || 'video'}.mp4`;
    return { file: new File([buffer], name, { type: 'video/mp4' }), compressed: true };
  } catch (err) {
    console.error('[video-compress] 실패 — 원본 업로드', err);
    return { file, compressed: false, note: '영상 줄이기에 실패해 원본을 올립니다.' };
  }
}
