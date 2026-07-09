import type { MemberAggregateRow } from './useMemberAggregates';
import { ageFromDob } from '../../utils/age';
import { parseLocation } from '../../utils/parseLocation';

export interface DemoBarEntry {
  label: string;
  count: number;
  display: string;
}

function ageBucket(age: number): string {
  if (age <= 14) { return '13-14'; }
  if (age <= 16) { return '15-16'; }
  if (age <= 18) { return '17-18'; }
  return '19+';
}

export function computeGenderEntries(members: MemberAggregateRow[]): DemoBarEntry[] {
  const tally: Record<string, number> = { Male: 0, Female: 0, Nonbinary: 0, Undisclosed: 0 };
  members.forEach((m) => {
    const key = m.gender && Object.prototype.hasOwnProperty.call(tally, m.gender) ? m.gender : 'Undisclosed';
    tally[key]++;
  });

  const total = members.length;
  return Object.keys(tally)
    .map((label) => {
      const count = tally[label];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { label, count, display: `${pct}% (${count})` };
    })
    .sort((a, b) => b.count - a.count);
}

export function computeEducationEntries(members: MemberAggregateRow[]): DemoBarEntry[] {
  const tally: Record<string, number> = {};
  members.forEach((m) => {
    const key = m.education_level || 'Not specified';
    tally[key] = (tally[key] || 0) + 1;
  });

  const total = members.length;
  return Object.keys(tally)
    .map((label) => {
      const count = tally[label];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { label, count, display: `${pct}% (${count})` };
    })
    .sort((a, b) => b.count - a.count);
}

export interface LocationDemographics {
  entries: DemoBarEntry[];
  matchedCount: number;
  distinctCount: number;
}

function tallyToEntries(tally: Record<string, number>, total: number): DemoBarEntry[] {
  return Object.keys(tally)
    .map((label) => {
      const count = tally[label];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { label, count, display: `${pct}% (${count})` };
    })
    .sort((a, b) => b.count - a.count);
}

// Both derived from profiles.location, a free-text field -- see
// parseLocation for why this isn't a simple split. matchedCount is how
// many members had a location that resolved to a country/state at all,
// separate from total member count, so the UI can show "matched of total"
// rather than implying every member's location was parseable.
export function computeCountryEntries(members: MemberAggregateRow[]): LocationDemographics {
  const tally: Record<string, number> = {};
  let matchedCount = 0;
  members.forEach((m) => {
    const { country } = parseLocation(m.location);
    if (country) {
      tally[country] = (tally[country] || 0) + 1;
      matchedCount++;
    }
  });

  const entries = tallyToEntries(tally, matchedCount);
  return { entries, matchedCount, distinctCount: entries.length };
}

export function computeStateEntries(members: MemberAggregateRow[]): LocationDemographics {
  const tally: Record<string, number> = {};
  let matchedCount = 0;
  members.forEach((m) => {
    const { state } = parseLocation(m.location);
    if (state) {
      tally[state] = (tally[state] || 0) + 1;
      matchedCount++;
    }
  });

  const entries = tallyToEntries(tally, matchedCount);
  return { entries, matchedCount, distinctCount: entries.length };
}

export function computeAgeEntries(members: MemberAggregateRow[]): { entries: DemoBarEntry[]; withDobCount: number } {
  const withDob = members.filter((m) => !!m.date_of_birth);
  const buckets: Record<string, number> = { '13-14': 0, '15-16': 0, '17-18': 0, '19+': 0 };

  withDob.forEach((m) => {
    const age = ageFromDob(m.date_of_birth as string);
    buckets[ageBucket(age)]++;
  });

  const entries = ['13-14', '15-16', '17-18', '19+'].map((label) => {
    const count = buckets[label];
    const pct = withDob.length > 0 ? Math.round((count / withDob.length) * 100) : 0;
    return { label, count, display: `${pct}% (${count})` };
  });

  return { entries, withDobCount: withDob.length };
}
