import { useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import { Card } from '../../components/Card';
import { PieChart, type PieSlice } from '../../charts/PieChart';

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  Projects: '#245ec2',
  Mapping: '#ff5961',
  Mapathons: '#10b981',
  Mentorship: '#f59e0b',
  'Impact Hours': '#7db9ff',
};

interface Slice extends PieSlice {
  label: string;
}

export function HoursPieChart() {
  const [slices, setSlices] = useState<Slice[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await apiOrToast(
        api.get<{ data: { activity_type: string }[] }>('/service-logs?status=approved'),
        'Loading activity breakdown',
        { data: [] }
      );

      const tally: Record<string, number> = {};
      result.data.forEach((row) => {
        const key = row.activity_type || 'Other';
        tally[key] = (tally[key] || 0) + 1;
      });

      let runningTotal = 0;
      const computed = Object.keys(tally).map((label) => {
        runningTotal += tally[label];
        return { label, value: tally[label], color: ACTIVITY_TYPE_COLORS[label] || '#6b7280' };
      });

      if (!cancelled) {
        setSlices(computed);
        setTotal(runningTotal);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
        <i className="ti ti-chart-pie text-muted text-[17px]" /> Completed Activities by Type
      </div>
      <div className="text-[11.5px] text-muted mb-[6px]">
        Share of all completed activity and time log submissions, by activity type.
      </div>
      <PieChart data={slices} size={200} />
      {total > 0 ? (
        <div className="flex flex-col gap-[9px] mt-[14px]">
          {slices.map((slice) => {
            const pct = Math.round((slice.value / total) * 100);
            return (
              <div key={slice.label} className="flex items-center gap-[9px] text-[12.5px] text-text">
                <div className="w-[11px] h-[11px] rounded-[3px] shrink-0" style={{ background: slice.color }} />
                <span>{slice.label}</span>
                <span className="ml-auto font-bold text-muted">{pct}% ({slice.value} submissions)</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
