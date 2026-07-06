import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { SegmentedToggle } from '../../components/SegmentedToggle';
import { LineAreaChart } from '../../charts/LineAreaChart';
import { monthNames, availableYears } from '../../charts/format';
import { iconFor, cumulativeMonthlySeries, cumulativeWeeklySeriesForMonth, type Metric } from './metrics';

const WEEK_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MetricLineChartProps {
  metric: Metric | undefined;
}

export function MetricLineChart({ metric }: MetricLineChartProps) {
  const [range, setRangeState] = useState<'month' | 'year'>('month');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYearState] = useState(new Date().getFullYear());

  // Mirrors selectImpactMetric() resetting selectedMonthIndex whenever the
  // selected metric changes.
  useEffect(() => {
    setSelectedMonthIndex(null);
  }, [metric?.key]);

  // Resolve the month index once events are available, same fallback as
  // the vanilla renderChart(): latest month with data, else the current
  // real-world month.
  useEffect(() => {
    if (!metric || selectedMonthIndex !== null) { return; }
    const monthsWithData = metric.events
      .map((e) => new Date(e.date))
      .filter((d) => d.getFullYear() === selectedYear)
      .map((d) => d.getMonth());
    setSelectedMonthIndex(monthsWithData.length > 0 ? Math.max(...monthsWithData) : new Date().getMonth());
  }, [metric, selectedMonthIndex, selectedYear]);

  function setRange(newRange: 'month' | 'year') {
    setRangeState(newRange);
    setSelectedMonthIndex(null);
  }

  function selectYear(yr: number) {
    setSelectedYearState(yr);
    setSelectedMonthIndex(null);
  }

  const data = !metric || selectedMonthIndex === null
    ? []
    : range === 'month'
      ? cumulativeWeeklySeriesForMonth(metric.events, selectedYear, selectedMonthIndex)
      : cumulativeMonthlySeries(metric.events, selectedYear);
  const labels = range === 'month' ? WEEK_LABELS : MONTH_LABELS;

  return (
    <Card>
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div className="font-heading text-[16px] text-text flex items-center gap-[9px] tracking-[0.01em]">
          <span className="text-xl">{metric ? iconFor(metric.key) : ''}</span>
          <span>{metric?.label ?? ''}</span>
        </div>
        <div className="flex gap-[10px] flex-wrap items-center">
          {range === 'month' ? (
            <select
              value={selectedMonthIndex ?? ''}
              onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value, 10))}
              className="px-[10px] py-[7px] border border-border rounded-lg text-[13px] text-text bg-bg outline-none font-sans w-auto"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i}>{name} {selectedYear}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => selectYear(parseInt(e.target.value, 10))}
              className="px-[10px] py-[7px] border border-border rounded-lg text-[13px] text-text bg-bg outline-none font-sans w-auto"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          )}
          <SegmentedToggle
            options={[{ value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }]}
            value={range}
            onChange={setRange}
          />
        </div>
      </div>
      {data.length > 0 ? (
        <LineAreaChart data={data} labels={labels} color="#245ec2" width={700} height={260} />
      ) : null}
    </Card>
  );
}
