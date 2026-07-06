export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const availableYears = [2025, 2026];

export function formatCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  const v = Math.abs(value);
  if (v >= 10000) { return sign + Math.round(v / 1000) + 'k'; }
  if (v >= 1000) { return sign + (v / 1000).toFixed(1) + 'k'; }
  return sign + Math.round(v);
}
