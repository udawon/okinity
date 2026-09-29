import { describe, expect, it } from 'vitest';
import { safeAction, ACTION_FAILED_MESSAGE } from './safe-action';

describe('safeAction — 서버액션이 던지면(로그인 만료·연결 끊김) 저장 멈춤 대신 안내', () => {
  it('정상 결과는 그대로', async () => {
    expect(await safeAction<{ ok?: boolean; error?: string }>(async () => ({ ok: true }))).toEqual({ ok: true });
    expect(await safeAction(async () => ({ error: '입력 오류' }))).toEqual({ error: '입력 오류' });
  });
  it('예외는 안내 문구 error 로', async () => {
    const res = await safeAction<{ ok?: boolean; error?: string }>(async () => {
      throw new Error('An unexpected response was received from the server.');
    });
    expect(res).toEqual({ error: ACTION_FAILED_MESSAGE });
    expect(ACTION_FAILED_MESSAGE).toMatch(/다시 로그인/);
  });
});
