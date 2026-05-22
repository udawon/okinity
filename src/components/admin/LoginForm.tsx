'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/admin/actions';

const initial: LoginState = {};

export default function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          비밀번호가 올바르지 않습니다.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-button bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? '확인 중...' : '로그인'}
      </button>
    </form>
  );
}
