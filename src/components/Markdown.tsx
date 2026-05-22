import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** 마크다운 본문 렌더러 — 상품/강사 설명에 사용. 기본 타이포 스타일 적용. */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink [&_a]:text-brand-dark [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
