interface StatCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  sub?: string;
  subClassName?: string;
}

export function StatCard({ label, value, valueClassName = 'text-text', sub, subClassName = 'text-success' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-[11px] px-4 py-[18px]">
      <div className="text-[11px] text-muted font-medium uppercase tracking-[0.05em] mb-[7px]">{label}</div>
      <div className={`text-[26px] font-bold font-heading ${valueClassName}`}>{value}</div>
      {sub ? <div className={`text-[11px] mt-1 ${subClassName}`}>{sub}</div> : null}
    </div>
  );
}
