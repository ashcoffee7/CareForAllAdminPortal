import { iconFor, formatCompactNumber, totalFor, type Metric } from './metrics';

interface MetricCardGridProps {
  metrics: Metric[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function MetricCardGrid({ metrics, selectedKey, onSelect }: MetricCardGridProps) {
  return (
    <div className="grid grid-cols-4 max-portal:grid-cols-2 gap-3">
      {metrics.map((m) => {
        const selected = m.key === selectedKey;
        return (
          <div
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`bg-card border-[1.5px] rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
              selected ? 'border-brand bg-hover-tint' : 'border-border hover:border-brand hover:shadow-[0_4px_16px_rgba(36,94,194,0.12)]'
            }`}
          >
            <div className="text-2xl mb-[7px]">{iconFor(m.key)}</div>
            <div className="text-[21px] font-bold font-heading text-text">{formatCompactNumber(totalFor(m))}</div>
            <div className="text-[11px] text-muted mt-[3px] leading-[1.3]">{m.label}</div>
          </div>
        );
      })}
    </div>
  );
}
