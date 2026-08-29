import { Link } from '@/i18n/routing';

/** 예약 문의 CTA 링크 — 투어 상세(서버)와 낚시 클래스 구획(클라이언트)이 공용. */
export default function ReserveCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-10">
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300"
      >
        {label}
      </Link>
    </div>
  );
}
