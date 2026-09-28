import Icon from './icons';

export type TourFact = { icon: 'clock' | 'calendar' | 'id' | 'users'; label: string; value: string };

/**
 * 요약 타일 — 값이 있는 것만 받는다(빈 타일은 호출부에서 제외). 1~4개에 맞춰 열 수 조정.
 */
export default function TourFacts({ facts }: { facts: TourFact[] }) {
  if (!facts.length) return null;
  const cols =
    facts.length >= 4 ? 'sm:grid-cols-4' : facts.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <dl className={`mt-8 grid grid-cols-2 gap-3 ${cols}`}>
      {facts.map((f) => (
        <div
          key={f.label}
          className="rounded-2xl border border-white/10 bg-[#061522]/60 p-4 backdrop-blur-md sm:p-5"
        >
          <Icon name={f.icon} className="hidden h-5 w-5 text-[#5fc6ef] sm:block" />
          <dt className="text-[13px] text-white/60 sm:mt-2">{f.label}</dt>
          <dd className="mt-1 text-[15px] font-bold leading-snug text-white">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
