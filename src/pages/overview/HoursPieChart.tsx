import { useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import { Card } from '../../components/Card';
import { PieChart, type PieSlice } from '../../charts/PieChart';
import { classifyActivity } from '../../utils/activityCategory';

// Fixed set of activity categories, always shown in the legend -- even at
// zero -- so the chart's shape doesn't silently change depending on what
// happened to get logged. Order here is display order.
const CATEGORIES: { label: string; color: string }[] = [
  { label: 'Projects', color: '#245ec2' },
  { label: 'Mapping', color: '#ff5961' },
  { label: 'Mapathons', color: '#10b981' },
  { label: 'Mentorship', color: '#f59e0b' },
  { label: 'Impact Hours', color: '#7db9ff' },
];

const OTHER_COLOR = '#6b7280';

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

      const counts: Record<string, number> = {};
      CATEGORIES.forEach((c) => { counts[c.label] = 0; });
      let otherCount = 0;

      result.data.forEach((row) => {
        const category = classifyActivity(row.activity_type || '');
        if (category) { counts[category]++; } else { otherCount++; }
      });

      // The five known categories always render in the legend, even at
      // zero. An "Other" slice only appears if some submission genuinely
      // didn't match any of them, so real data is never silently dropped.
      const computed: Slice[] = CATEGORIES.map((c) => ({ label: c.label, value: counts[c.label], color: c.color }));
      if (otherCount > 0) { computed.push({ label: 'Other', value: otherCount, color: OTHER_COLOR }); }

      if (!cancelled) {
        setSlices(computed);
        setTotal(computed.reduce((sum, s) => sum + s.value, 0));
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
      {/* Zero-value slices would draw a degenerate arc, so only non-zero
          ones go to the pie geometry -- but every category still appears
          below in the legend regardless of count. */}
      <PieChart data={slices.filter((s) => s.value > 0)} size={200} />
      <div className="flex flex-col gap-[9px] mt-[14px]">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <div key={slice.label} className="flex items-center gap-[9px] text-[12.5px] text-text">
              <div className="w-[11px] h-[11px] rounded-[3px] shrink-0" style={{ background: slice.color }} />
              <span>{slice.label}</span>
              <span className="ml-auto font-bold text-muted">{pct}% ({slice.value} submissions)</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
