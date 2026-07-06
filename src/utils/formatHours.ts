// Direct port of the one formatHours() implementation (only ever existed
// in approvals.js -- no duplication to reconcile here).
export function formatHours(h: number | null | undefined): string {
  const n = Number(h) || 0;
  return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + (n === 1 ? ' hr' : ' hrs');
}
