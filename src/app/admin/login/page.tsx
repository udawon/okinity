import LoginForm from '@/components/admin/LoginForm';

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8">
        <h1 className="text-xl font-bold text-ink">OKINITY 어드민</h1>
        <p className="mt-1 text-sm text-muted">관리자 비밀번호를 입력하세요.</p>
        <div className="mt-6">
          <LoginForm from={from ?? '/admin'} />
        </div>
      </div>
    </main>
  );
}
