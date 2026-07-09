export type ActivityCategory = 'Projects' | 'Mapping' | 'Mapathons' | 'Mentorship' | 'Impact Hours';

// service_logs.activity_type is free text, not an enum matching these
// labels exactly -- an exact-key lookup was silently falling back to gray
// for almost every real submission on the Overview pie chart. Bucketed by
// substring match instead, checked in priority order: "mapathon" also
// contains "map", so it has to be checked before the general mapping
// bucket. Shared with the Mapping Submissions tab, which needs the same
// classification to tell a "Mapping" row apart from a "Mapathons" one.
export function classifyActivity(activityType: string): ActivityCategory | null {
  const t = activityType.toLowerCase();
  if (t.includes('project')) { return 'Projects'; }
  if (t.includes('mapathon')) { return 'Mapathons'; }
  if (t.includes('map')) { return 'Mapping'; }
  if (t.includes('mentor')) { return 'Mentorship'; }
  if (t.includes('impact')) { return 'Impact Hours'; }
  return null;
}
