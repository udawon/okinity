import { getInquiryStore } from '@/lib/inquiries';
import AdminShell from '@/components/admin/AdminShell';
import InquiryTable from '@/components/admin/InquiryTable';

// 항상 최신 데이터를 보여줘야 하므로 동적 렌더링.
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const store = await getInquiryStore();
  const inquiries = await store.list();

  return (
    <AdminShell title="예약 관리">
      <InquiryTable inquiries={inquiries} />
    </AdminShell>
  );
}
