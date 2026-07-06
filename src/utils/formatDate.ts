// Consolidates the 3 near-identical formatDate() copies from the old
// approvals.js/chapters.js/members.js. Their only difference was the
// fallback for a missing date: approvals.js used '', chapters.js and
// members.js used '—'. Default to '—' and have approvals' two call sites
// pass '' explicitly, so behavior stays byte-for-byte the same per page.
export function formatDate(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) { return fallback; }
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
