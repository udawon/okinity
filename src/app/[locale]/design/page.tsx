import { design } from '@/config/design.config';

/**
 * 디자인 토큰 미리보기. design.config.ts에서 직접 import하므로
 * 토큰 값을 바꾸면 이 페이지가 자동으로 반영한다. (검색 노출 차단)
 */
export const metadata = {
  title: '디자인 토큰',
  robots: { index: false, follow: false }
};

// 텍스트 대비를 위해 어두운 토큰만 흰색 글씨로 표시
const DARK_TOKENS = new Set(['DEFAULT', 'dark', 'ink', 'muted']);

function Swatch({
  name,
  value,
  groupKey
}: {
  name: string;
  value: string;
  groupKey?: string;
}) {
  const isDark = groupKey ? DARK_TOKENS.has(groupKey) : false;
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div
        className="flex h-28 items-end justify-between p-3 text-xs font-medium"
        style={{ background: value, color: isDark ? '#fff' : design.colors.ink }}
      >
        <span>{name}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="px-3 py-2 text-xs text-muted">
        <code>{name}</code>
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </header>
      {children}
    </section>
  );
}

export default function DesignTokensPage() {
  const { colors, radius, shadow, container } = design;

  // 평탄화: brand.DEFAULT, brand.dark ... 형태로 모든 색 토큰을 그린다
  const colorGroups: Array<[string, Record<string, string> | string]> = Object.entries(colors);

  return (
    <div className="relative min-h-dvh bg-bg text-ink">
      <div className="mx-auto max-w-container px-6 py-16 space-y-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-brand">design.config.ts</p>
          <h1 className="font-serif text-4xl text-ink">디자인 토큰</h1>
          <p className="text-sm text-muted">
            <code>src/config/design.config.ts</code> — 색·radius·shadow·container의 단일 출처.
            값을 바꾸면 이 페이지와 사이트 전체가 함께 변한다.
          </p>
        </header>

        <Section
          title="색 (Colors)"
          desc="brand·accent는 객체(DEFAULT/dark/light...), 그 외는 단일 hex."
        >
          {colorGroups.map(([groupName, value]) => (
            <div key={groupName} className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">
                {groupName}
                {typeof value === 'string' && (
                  <span className="ml-2 font-mono text-xs text-muted">{value}</span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {typeof value === 'string' ? (
                  <Swatch name={groupName} value={value} groupKey={groupName} />
                ) : (
                  Object.entries(value).map(([key, hex]) => (
                    <Swatch
                      key={key}
                      name={`${groupName}.${key}`}
                      value={hex}
                      groupKey={key}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </Section>

        <Section title="모서리 (Radius)" desc="card는 카드/패널용, button은 알약형 버튼.">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface p-6 shadow-card border border-line"
                 style={{ borderRadius: radius.card }}>
              <p className="text-xs text-muted">card</p>
              <p className="font-mono text-sm text-ink">{radius.card}</p>
            </div>
            <div className="flex items-center justify-center bg-brand text-white px-6 py-4"
                 style={{ borderRadius: radius.button }}>
              <span className="text-sm">button — {radius.button}</span>
            </div>
          </div>
        </Section>

        <Section title="그림자 (Shadow)" desc="card는 기본 부양, hover는 강조 인터랙션.">
          <div className="grid grid-cols-2 gap-6">
            <div
              className="rounded-card bg-surface p-8"
              style={{ boxShadow: shadow.card }}
            >
              <p className="text-sm font-semibold text-ink">shadow.card</p>
              <p className="mt-1 font-mono text-xs text-muted break-all">{shadow.card}</p>
            </div>
            <div
              className="rounded-card bg-surface p-8"
              style={{ boxShadow: shadow.hover }}
            >
              <p className="text-sm font-semibold text-ink">shadow.hover</p>
              <p className="mt-1 font-mono text-xs text-muted break-all">{shadow.hover}</p>
            </div>
          </div>
        </Section>

        <Section title="타이포 (Typography)" desc="제목=세리프(Playfair+Noto Serif KR), 본문=산세리프(Noto Sans KR).">
          <div className="space-y-3 rounded-card bg-surface p-6 shadow-card">
            <h1 className="font-serif text-5xl text-ink">Heading 1 — 오션라이프</h1>
            <h2 className="font-serif text-3xl text-ink">Heading 2 — 깊은 바다</h2>
            <h3 className="font-serif text-2xl text-ink">Heading 3 — PADI 교육</h3>
            <p className="text-base text-ink">
              본문 텍스트입니다. 산세리프 폰트로 가독성을 우선합니다. The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-sm text-muted">보조 텍스트(muted) — 캡션·메타·라벨에 사용.</p>
          </div>
        </Section>

        <Section title="컨테이너 (Container)" desc={`max-width: ${container.max} (1248px)`}>
          <div className="bg-panel p-4 rounded-card">
            <div
              className="bg-brand/10 border-2 border-dashed border-brand h-16 flex items-center justify-center text-sm text-brand"
              style={{ maxWidth: container.max, margin: '0 auto' }}
            >
              max-w-container — {container.max}
            </div>
          </div>
        </Section>

        <Section title="버튼 견본" desc="실제 컴포넌트에 토큰이 어떻게 결합되는지.">
          <div className="flex flex-wrap gap-3">
            <button className="rounded-button bg-brand px-6 py-3 text-sm font-medium text-white shadow-card hover:bg-[color:var(--brand-dark)] transition"
                    style={{ ['--brand-dark' as string]: colors.brand.dark }}>
              Primary — bg-brand
            </button>
            <button className="rounded-button border border-brand bg-transparent px-6 py-3 text-sm font-medium text-brand hover:bg-brand/5 transition">
              Outline — border-brand
            </button>
            <button className="rounded-button bg-accent px-6 py-3 text-sm font-medium text-white shadow-card">
              Accent — bg-accent
            </button>
            <button className="rounded-button bg-ink px-6 py-3 text-sm font-medium text-white">
              Ink — bg-ink
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
