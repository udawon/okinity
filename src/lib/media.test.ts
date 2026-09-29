import { describe, expect, it } from 'vitest';
import { mediaKind } from './media';

describe('mediaKind — 배경 미디어 종류는 파일로 판단', () => {
  it('영상·이미지 확장자는 선택값과 무관하게 파일을 따른다', () => {
    expect(mediaKind('https://x/hero/a.mp4', 'image')).toBe('video');
    expect(mediaKind('https://x/hero/a.webm?v=1', 'image')).toBe('video');
    expect(mediaKind('https://x/hero/a.jpg', 'video')).toBe('image');
    expect(mediaKind('/images/hero.webp', 'video')).toBe('image');
  });
  it('확장자로 알 수 없으면 저장된 선택값, 그것도 없으면 이미지', () => {
    expect(mediaKind('https://cdn.example.com/stream/123', 'video')).toBe('video');
    expect(mediaKind('https://cdn.example.com/stream/123', undefined)).toBe('image');
  });
});
