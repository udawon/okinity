import { defineConfig } from 'vitest/config';
import path from 'node:path';

// 순수 로직 단위 테스트 전용(DOM 없음). '@/' 경로 별칭은 tsconfig 와 동일하게 src 를 가리킨다.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' }
});
