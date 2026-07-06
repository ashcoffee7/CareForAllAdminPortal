import type { DemoBarEntry } from './demographics';

interface DemographicsBarsProps {
  entries: DemoBarEntry[];
}

export function DemographicsBars({ entries }: DemographicsBarsProps) {
  if (entries.length === 0) {
    return <div className="text-center py-4 text-muted text-[13px]">No data yet.</div>;
  }

  const maxCount = Math.max(...entries.map((e) => e.count));

  return (
    <div>
      {entries.map((e, i) => {
        const widthPct = maxCount > 0 ? Math.round((e.count / maxCount) * 100) : 0;
        return (
          <div key={e.label} className={`flex items-center gap-[11px] ${i === entries.length - 1 ? '' : 'mb-[11px]'}`}>
            <div className="text-[12px] text-text w-[110px] shrink-0">{e.label}</div>
            <div className="flex-1 h-[9px] bg-bg rounded-[5px] overflow-hidden border border-border">
              <div className="h-full bg-brand rounded-[5px]" style={{ width: `${widthPct}%` }} />
            </div>
            <div className="text-[12px] text-muted w-[56px] text-right shrink-0">{e.display}</div>
          </div>
        );
      })}
    </div>
  );
}
