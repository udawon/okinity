'use client';

/**
 * 브라우저 내 영상 압축 — 업로드 한도(50MB)를 넘는 영상을 WebCodecs(하드웨어 인코더)로
 * 재인코딩해 한도 안에 밀어 넣는다. mediabunny 는 압축 시점에만 동적 import 되므로
 * 어드민 페이지 초기 번들에는 포함되지 않는다.
 *
 * 서버에서 압축하지 않는 이유: 파일 본문이 Vercel 서버리스(요청 4.5MB 한도)를 거칠 수 없고,
 * 별도 변환 서버는 현 운영 규모에 과하다. 어드민 브라우저(최신 Chrome/Edge/Safari)만
 * 지원하면 되므로 클라이언트 압축이 가장 싼 해법이다.
 *
 * 물리적 한계: 목표 용량이 고정이라 영상이 길수록 비트레이트가 낮아져 화질이 떨어진다.
 * 물속 영상(부유물·잔물결)은 특히 비트레이트에 민감해, 저비트레이트 구간에서는 경고를 함께 돌려준다.
 */

/** 컨테이너 오버헤드 + VBR 오차를 감안해 목표 용량의 이만큼만 비트레이트 예산으로 쓴다. */
const BUDGET_RATIO = 0.9;
const MIN_VIDEO_BPS = 400_000;
const MAX_VIDEO_BPS = 8_000_000;
/** 이 밑으로 내려가면 스노클링 영상 기준 열화가 눈에 띈다 — 화질 경고 기준. */
const LOW_QUALITY_BPS = 1_500_000;
/** 오디오 비트레이트를 알 수 없을 때의 보수적 추정치(폰·액션캠 AAC 상한 수준). */
const FALLBACK_AUDIO_BPS = 160_000;
/** 웹 게시용 프레임레이트 상한 — 60fps 소스를 30fps 로 낮춰 비트레이트를 화질에 쓴다. */
const MAX_FRAME_RATE = 30;

export type CompressPlan = {
  /** 영상 트랙에 배정할 비트레이트(bps). */
  videoBitrate: number;
  /** 출력 세로 해상도 상한(소스보다 크면 리사이즈 생략). */
  maxHeight: number;
  /** 프레임레이트 제한이 필요할 때만 설정. */
  frameRate?: number;
  /** 저비트레이트 화질 경고 — 업로드는 진행하되 어드민에게 보여준다. */
  warning?: string;
};

/**
 * 목표 용량·길이로부터 인코딩 파라미터를 계산한다(순수 함수).
 * 비트레이트가 낮아질수록 해상도도 함께 낮춰야 뭉개짐(블록 노이즈)이 덜하다 —
 * "1080p 저비트레이트"보다 "720p 같은 비트레이트"가 체감 화질이 좋다.
 */
export function planVideoCompression(input: {
  durationSec: number;
  sourceHeight: number;
  sourceFrameRate?: number;
  audioBitrate?: number;
  targetBytes: number;
}): CompressPlan {
  const { durationSec, sourceHeight, sourceFrameRate, targetBytes } = input;
  const audioBitrate = input.audioBitrate || FALLBACK_AUDIO_BPS;

  const totalBudget = (targetBytes * 8 * BUDGET_RATIO) / Math.max(durationSec, 1);
  const videoBitrate = Math.round(
    Math.min(MAX_VIDEO_BPS, Math.max(MIN_VIDEO_BPS, totalBudget - audioBitrate))
  );

  const ladder =
    videoBitrate >= 3_500_000 ? 1080 : videoBitrate >= 1_800_000 ? 720 : videoBitrate >= 900_000 ? 540 : 480;
  const maxHeight = Math.min(ladder, sourceHeight);

  const frameRate =
    sourceFrameRate && sourceFrameRate > MAX_FRAME_RATE + 1 ? MAX_FRAME_RATE : undefined;

  const warning =
    videoBitrate < LOW_QUALITY_BPS
      ? '영상이 길어 화질을 많이 낮췄습니다. 더 선명하게 올리려면 3분 이내로 나눠 업로드해주세요.'
      : undefined;

  return { videoBitrate, maxHeight, frameRate, warning };
}

export type CompressResult = { file: File; warning?: string };

/**
 * 영상 파일을 maxBytes 이하로 재인코딩한다(H.264/MP4 — 재생 호환성 최우선).
 * 결과가 목표를 넘으면 실측 크기로 비트레이트를 보정해 1회 재시도한다.
 *
 * @param onProgress 0~1. 재시도 시 0부터 다시 시작한다(드묾).
 * @throws 브라우저가 인코딩/디코딩을 지원하지 않거나 결과가 한도를 넘으면 한국어 메시지로 throw.
 */
export async function compressVideoFile(
  file: File,
  maxBytes: number,
  onProgress?: (ratio: number) => void
): Promise<CompressResult> {
  const {
    Input,
    Output,
    Conversion,
    Quality,
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Mp4OutputFormat,
    canEncodeVideo
  } = await import('mediabunny');

  if (!(await canEncodeVideo('avc'))) {
    throw new Error(
      '이 브라우저는 영상 압축을 지원하지 않습니다. 최신 Chrome·Edge·Safari 에서 다시 시도해주세요.'
    );
  }

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) throw new Error('영상 트랙을 찾을 수 없는 파일입니다.');
  if (!(await videoTrack.canDecode())) {
    throw new Error(
      '이 영상의 형식(코덱)은 브라우저에서 변환할 수 없습니다. 카메라 설정을 "높은 호환성(H.264)"으로 바꿔 다시 내보내주세요.'
    );
  }

  const durationSec = await input.computeDuration();
  const sourceHeight = await videoTrack.getDisplayHeight();

  // 앞부분 일부 패킷만 표본으로 평균 비트레이트·프레임레이트를 추정한다(전체 스캔은 수백 MB 파일에서 느리다).
  const videoStats = await videoTrack.computePacketStats(200).catch(() => null);
  const audioTrack = await input.getPrimaryAudioTrack();
  const audioStats = audioTrack ? await audioTrack.computePacketStats(200).catch(() => null) : null;

  const plan = planVideoCompression({
    durationSec,
    sourceHeight,
    sourceFrameRate: videoStats?.averagePacketRate || undefined,
    audioBitrate: audioStats?.averageBitrate || undefined,
    targetBytes: maxBytes
  });

  let bitrate = plan.videoBitrate;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const output = new Output({
      // fastStart: 메타데이터(moov)를 파일 앞에 둬야 방문자가 전체를 받기 전에 재생을 시작할 수 있다.
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget()
    });

    const conversion = await Conversion.init({
      input,
      output,
      video: {
        codec: 'avc',
        ...(plan.maxHeight < sourceHeight ? { height: plan.maxHeight } : {}),
        ...(plan.frameRate ? { frameRate: plan.frameRate } : {}),
        quality: new Quality({ bitrate, bitrateMode: 'variable' }),
        forceTranscode: true
      }
      // 오디오는 옵션을 주지 않는다 — 가능하면 원본 그대로 복사(passthrough)되고,
      // 출력 포맷이 못 담는 코덱일 때만 mediabunny 가 알아서 재인코딩한다.
    });

    if (!conversion.isValid) {
      const dropped = conversion.discardedTracks.map((t) => t.track.type).join(', ');
      throw new Error(`이 영상은 변환할 수 없습니다(제외된 트랙: ${dropped || '없음'}).`);
    }

    conversion.onProgress = (p: number) => onProgress?.(p);
    await conversion.execute();

    const buffer = output.target.buffer;
    if (!buffer) throw new Error('압축 결과를 만들지 못했습니다.');

    if (buffer.byteLength <= maxBytes) {
      const name = file.name.replace(/\.[^.]+$/, '') + '.mp4';
      return { file: new File([buffer], name, { type: 'video/mp4' }), warning: plan.warning };
    }
    // 목표 초과 — 실측 크기 비율로 비트레이트를 깎아 한 번 더 시도한다.
    bitrate = Math.max(MIN_VIDEO_BPS, Math.floor((bitrate * (maxBytes * 0.85)) / buffer.byteLength));
  }

  throw new Error('압축해도 용량 한도를 넘습니다. 영상을 더 짧게 잘라 다시 시도해주세요.');
}
