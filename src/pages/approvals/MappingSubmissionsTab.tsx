import { Card } from '../../components/Card';
import { IconButton } from '../../components/IconButton';

// This whole tab is a direct JSX transcription of the old static markup --
// there is no mapping/mapathon submissions table in the schema yet (see
// the TODO in the old main.js), and no click handlers were ever wired to
// these icon buttons in the vanilla app. Do not add data-fetching or
// onClick behavior here; that would be new scope.

interface MappingRow {
  name: string;
  chapter: string;
  buildings: string;
  roads: string;
  date: string;
  hours: string;
}

const MAPPING_ROWS: MappingRow[] = [
  { name: 'Sofia Lopez', chapter: 'VA-Fairfax', buildings: '12 buildings', roads: '3.4 km', date: 'Jun 2, 2026', hours: '2 hrs' },
  { name: 'David Mwangi', chapter: 'VA-Fairfax', buildings: '8 buildings', roads: '1.8 km', date: 'Jun 3, 2026', hours: '1.5 hrs' },
  { name: 'Tariq Hassan', chapter: 'MI-Detroit', buildings: '21 buildings', roads: '5.6 km', date: 'Jun 4, 2026', hours: '3 hrs' },
];

interface MapathonRow extends MappingRow {
  event: string;
}

const MAPATHON_ROWS: MapathonRow[] = [
  { name: 'Priya Rao', chapter: 'VA-Fairfax', event: 'Spring Regional Mapathon', buildings: '34 buildings', roads: '9.2 km', date: 'May 30, 2026', hours: '3 hrs' },
  { name: 'Wei Lin', chapter: 'CA-Bay Area', event: 'Spring Regional Mapathon', buildings: '29 buildings', roads: '7.8 km', date: 'May 30, 2026', hours: '3 hrs' },
];

export function MappingSubmissionsTab() {
  return (
    <Card>
      <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
        <i className="ti ti-map text-muted text-[17px]" /> Mapping Submissions
      </div>
      <div className="grid grid-cols-[1.4fr_0.9fr_0.9fr_1fr_0.8fr_1.1fr] gap-[10px] items-center py-3 border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Member</div>
        <div>Buildings</div>
        <div>Roads (km)</div>
        <div>Date</div>
        <div>Hours</div>
        <div>Action</div>
      </div>
      {MAPPING_ROWS.map((row) => (
        <div key={row.name} className="grid grid-cols-[1.4fr_0.9fr_0.9fr_1fr_0.8fr_1.1fr] gap-[10px] items-center py-3 border-b border-border last:border-b-0">
          <div>
            <div className="text-[13px] font-semibold text-text">{row.name}</div>
            <div className="text-[11.5px] text-muted">{row.chapter}</div>
          </div>
          <div className="text-[11.5px] text-muted">{row.buildings}</div>
          <div className="text-[11.5px] text-muted">{row.roads}</div>
          <div className="text-[11.5px] text-muted">{row.date}</div>
          <div className="font-semibold">{row.hours}</div>
          <div className="flex gap-[6px]">
            <IconButton icon="check" variant="approve" aria-label="Approve" />
            <IconButton icon="x" variant="reject" aria-label="Reject" />
            <IconButton icon="eye" variant="neutral" aria-label="Preview" />
          </div>
        </div>
      ))}

      <div className="text-[14px] font-bold text-text mt-6 mb-4 flex items-center gap-2">
        <i className="ti ti-map-2 text-muted text-[17px]" /> Mapathon Submissions
      </div>
      <div className="grid grid-cols-[1.4fr_1.3fr_0.9fr_0.9fr_1fr_0.8fr_1.1fr] gap-[10px] items-center py-3 border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Member</div>
        <div>Mapathon Event</div>
        <div>Buildings</div>
        <div>Roads (km)</div>
        <div>Date</div>
        <div>Hours</div>
        <div>Action</div>
      </div>
      {MAPATHON_ROWS.map((row) => (
        <div key={row.name} className="grid grid-cols-[1.4fr_1.3fr_0.9fr_0.9fr_1fr_0.8fr_1.1fr] gap-[10px] items-center py-3 border-b border-border last:border-b-0">
          <div>
            <div className="text-[13px] font-semibold text-text">{row.name}</div>
            <div className="text-[11.5px] text-muted">{row.chapter}</div>
          </div>
          <div className="text-[11.5px] text-muted">{row.event}</div>
          <div className="text-[11.5px] text-muted">{row.buildings}</div>
          <div className="text-[11.5px] text-muted">{row.roads}</div>
          <div className="text-[11.5px] text-muted">{row.date}</div>
          <div className="font-semibold">{row.hours}</div>
          <div className="flex gap-[6px]">
            <IconButton icon="check" variant="approve" aria-label="Approve" />
            <IconButton icon="x" variant="reject" aria-label="Reject" />
            <IconButton icon="eye" variant="neutral" aria-label="Preview" />
          </div>
        </div>
      ))}
    </Card>
  );
}
