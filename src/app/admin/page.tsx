import { getInquiryStore, type InquiryStatus } from '@/lib/inquiries';
import StatusControl from '@/components/admin/StatusControl';
import DeleteInquiryButton from '@/components/admin/DeleteInquiryButton';
import AdminNav from '@/components/admin/AdminNav';
import { logout } from './actions';

// 항상 최신 데이터를 보여줘야 하므로 동적 렌더링.
export const dynamic = 'force-dynamic';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function AdminDashboard() {
  const store = await getInquiryStore();
  const inquiries = await store.list();

  const counts = inquiries.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto w-full max-w-container px-5 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">예약 관리</h1>
          <p className="mt-1 text-sm text-muted">
            총 {inquiries.length}건 · 신규 {counts.new ?? 0} · 확정{' '}
            {counts.confirmed ?? 0} · 완료 {counts.done ?? 0}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-button border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            로그아웃
          </button>
        </form>
      </div>

      <div className="mt-4">
        <AdminNav />
      </div>

      {inquiries.length === 0 ? (
        <p className="mt-12 text-center text-muted">아직 접수된 문의가 없습니다.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">접수</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">희망일</th>
                <th className="px-4 py-3 font-medium">인원</th>
                <th className="px-4 py-3 font-medium">메시지</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((q) => (
                <tr key={q.id} className="border-b border-line last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {fmtDate(q.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{q.name}</td>
                  <td className="px-4 py-3 text-ink">{q.contact}</td>
                  <td className="px-4 py-3 text-ink">{q.product ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">
                    {q.date ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-ink">{q.people ?? '-'}</td>
                  <td className="max-w-xs px-4 py-3 text-muted">
                    {q.message ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusControl id={q.id} status={q.status as InquiryStatus} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <DeleteInquiryButton id={q.id} name={q.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
