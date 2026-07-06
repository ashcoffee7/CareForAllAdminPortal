import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];

async function fetchApprovedLogsForYear(year: number): Promise<{ submitted_at: string }[]> {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const { data, error } = await supabase
    .from('service_logs')
    .select('submitted_at, activity_type')
    .eq('status', 'approved')
    .gte('submitted_at', start)
    .lt('submitted_at', end);

  if (error) { console.error(error); return []; }
  return data;
}

function monthlyCountsFromLogs(logs: { submitted_at: string }[]): number[] {
  const counts = new Array(12).fill(0);
  logs.forEach((row) => { counts[new Date(row.submitted_at).getMonth()]++; });
  return counts;
}

function weeklyBreakdownForMonth(logs: { submitted_at: string }[], monthIdx: number): number[] {
  const weekly = [0, 0, 0, 0];
  logs.forEach((row) => {
    const d = new Date(row.submitted_at);
    if (d.getMonth() !== monthIdx) { return; }
    weekly[Math.min(3, Math.floor((d.getDate() - 1) / 7))]++;
  });
  // Running total across weeks, to match the original chart's
  // cumulative-in-month feel.
  let running = 0;
  return weekly.map((v) => { running += v; return running; });
}

export function useHoursChartData() {
  const [range, setRange] = useState<'month' | 'year'>('month');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>(WEEK_LABELS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const logs = await fetchApprovedLogsForYear(selectedYear);
      if (cancelled) { return; }

      let monthIdx = selectedMonthIndex;
      if (monthIdx === null) {
        monthIdx = logs.length > 0
          ? Math.max(...logs.map((r) => new Date(r.submitted_at).getMonth()))
          : new Date().getMonth();
        setSelectedMonthIndex(monthIdx);
        return; // effect will re-run now that selectedMonthIndex is resolved
      }

      if (range === 'month') {
        setData(weeklyBreakdownForMonth(logs, monthIdx));
        setLabels(WEEK_LABELS);
      } else {
        setData(monthlyCountsFromLogs(logs));
        setLabels(MONTH_LABELS);
      }
    })();

    return () => { cancelled = true; };
  }, [range, selectedMonthIndex, selectedYear]);

  return {
    range, setRange,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear, setSelectedYear,
    data, labels,
  };
}
