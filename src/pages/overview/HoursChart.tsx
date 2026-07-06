import { Card } from '../../components/Card';
import { SegmentedToggle } from '../../components/SegmentedToggle';
import { LineAreaChart } from '../../charts/LineAreaChart';
import { monthNames, availableYears } from '../../charts/format';
import { useHoursChartData } from './useHoursChartData';

export function HoursChart() {
  const { range, setRange, selectedMonthIndex, setSelectedMonthIndex, selectedYear, setSelectedYear, data, labels } = useHoursChartData();

  return (
    <Card>
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div className="font-heading text-[16px] text-text flex items-center gap-[9px] tracking-[0.01em]">
          <i className="ti ti-chart-line" /> Completed Activity Trend
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
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
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
      <div className="text-[11.5px] text-muted mb-[10px]">
        Each completed activity or time log form submission counts as one completed activity.
      </div>
      <LineAreaChart data={data} labels={labels} color="#245ec2" width={600} height={230} />
    </Card>
  );
}
