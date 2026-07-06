import { useState } from 'react';
import { Topbar } from '../../components/Topbar';
import { Card } from '../../components/Card';
import { useImpactEvents } from './useImpactEvents';
import { metricList } from './metrics';
import { MetricCardGrid } from './MetricCardGrid';
import { MetricLineChart } from './MetricLineChart';

export function ImpactPage() {
  const events = useImpactEvents();
  const [selectedMetric, setSelectedMetric] = useState('totalmembers');

  const metrics = events ? metricList(events) : [];
  const metric = metrics.find((m) => m.key === selectedMetric);

  return (
    <>
      <Topbar title="Impact Measurables" />

      <Card>
        <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
          <i className="ti ti-click text-muted text-[17px]" /> Select a Measurable
        </div>
        <div className="text-[12.5px] text-muted mb-4 leading-[1.5]">
          Click a metric below to view its trend chart, with Month / Year options.
        </div>
        <MetricCardGrid metrics={metrics} selectedKey={selectedMetric} onSelect={setSelectedMetric} />
      </Card>

      <MetricLineChart metric={metric} />
    </>
  );
}
