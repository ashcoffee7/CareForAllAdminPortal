export interface ImpactEvent {
  date: string;
  magnitude: number;
}

export interface ImpactEvents {
  totalmembers: ImpactEvent[];
  totalchapters: ImpactEvent[];
  categories: Record<string, ImpactEvent[]>;
}

export interface Metric {
  key: string;
  label: string;
  events: ImpactEvent[];
}

const KNOWN_ICONS: Record<string, string> = {
  totalmembers: '👥',
  totalchapters: '🏳',
  'People Reached': '🤝',
  'Items Distributed': '📦',
  'Funds Raised': '💵',
  'Roads Mapped': '🛣',
  'Buildings Mapped': '🏢',
};
const FALLBACK_ICON = '📊';

export function iconFor(key: string): string {
  return KNOWN_ICONS[key] || FALLBACK_ICON;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1000000) { return (n / 1000000).toFixed(1) + 'M'; }
  if (n >= 1000) { return (n / 1000).toFixed(1) + 'k'; }
  return String(Math.round(n));
}

// These three don't exist anywhere in the current data (no "Funds Raised"
// entries logged yet, and no mapping-specific fields anywhere in the
// schema) but should still show up as 0 rather than being hidden --
// unlike other categories, which only appear once real data exists for
// them.
const GUARANTEED_CATEGORIES = ['Funds Raised', 'Roads Mapped', 'Buildings Mapped'];

export function metricList(events: ImpactEvents): Metric[] {
  const list: Metric[] = [
    { key: 'totalmembers', label: 'Total Members', events: events.totalmembers },
    { key: 'totalchapters', label: 'Total Chapters', events: events.totalchapters },
  ];

  const categoryKeys = Object.keys(events.categories);
  GUARANTEED_CATEGORIES.forEach((key) => {
    if (categoryKeys.indexOf(key) === -1) { categoryKeys.push(key); }
  });

  categoryKeys.forEach((category) => {
    list.push({ key: category, label: category, events: events.categories[category] || [] });
  });

  return list;
}

export function totalFor(metric: Metric): number {
  if (metric.key === 'totalmembers' || metric.key === 'totalchapters') {
    return metric.events.length;
  }
  return metric.events.reduce((sum, e) => sum + e.magnitude, 0);
}

export function cumulativeMonthlySeries(metricEvents: ImpactEvent[], year: number): number[] {
  const monthly = new Array(12).fill(0);
  metricEvents.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() !== year) { return; }
    monthly[d.getMonth()] += e.magnitude;
  });
  let running = 0;
  return monthly.map((v) => { running += v; return running; });
}

export function cumulativeWeeklySeriesForMonth(metricEvents: ImpactEvent[], year: number, monthIdx: number): number[] {
  const weekly = [0, 0, 0, 0];
  metricEvents.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() !== year || d.getMonth() !== monthIdx) { return; }
    weekly[Math.min(3, Math.floor((d.getDate() - 1) / 7))] += e.magnitude;
  });
  let running = 0;
  return weekly.map((v) => { running += v; return running; });
}
