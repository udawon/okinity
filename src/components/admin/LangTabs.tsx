import Link from 'next/link';
import { CONTENT_LOCALES, type ContentLocale } from '@/lib/site-content';

const LABEL: Record<ContentLocale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語'
};

/**
 * 어드민 콘텐츠 편집기 언어 탭 — ?lang= 쿼리로 서버 재렌더(편집기 상태 초기화 포함).
 * ko는 기존 키, en/ja는 `${key}:{lang}` 키를 편집한다.
 */
export default function LangTabs({ basePath, current }: { basePath: string; current: string }) {
  return (
    <div className="flex items-center gap-1 rounded-button border border-line bg-bg/40 p-1 text-sm">
      {CONTENT_LOCALES.map((l) => (
        <Link
          key={l}
          href={l === 'ko' ? basePath : `${basePath}?lang=${l}`}
          className={`rounded-button px-3 py-1.5 transition-colors ${
            current === l
              ? 'bg-brand font-semibold text-brand-contrast'
              : 'text-muted hover:text-ink'
          }`}
        >
          {LABEL[l]}
        </Link>
      ))}
    </div>
  );
}
