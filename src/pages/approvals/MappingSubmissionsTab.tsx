import { useState } from 'react';
import { Card } from '../../components/Card';
import { IconButton } from '../../components/IconButton';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { MemberProfileModal } from '../../components/MemberProfileModal';
import { formatDate } from '../../utils/formatDate';
import { formatHours } from '../../utils/formatHours';
import { useMappingSubmissions, type MappingSubmissionRow } from './useMappingSubmissions';

// Mapathon Submissions below is still a direct JSX transcription of the old
// static markup -- there is no mapathon-event data in the schema (no
// event-name field on service_logs), so that section stays mock for now.
// Do not add data-fetching or onClick behavior to it; that would be new
// scope. Mapping Submissions above it is real, backed by service_logs.

interface MapathonRow {
  name: string;
  chapter: string;
  event: string;
  buildings: string;
  roads: string;
  date: string;
  hours: string;
}

const MAPATHON_ROWS: MapathonRow[] = [
  { name: 'Priya Rao', chapter: 'VA-Fairfax', event: 'Spring Regional Mapathon', buildings: '34 buildings', roads: '9.2 km', date: 'May 30, 2026', hours: '3 hrs' },
  { name: 'Wei Lin', chapter: 'CA-Bay Area', event: 'Spring Regional Mapathon', buildings: '29 buildings', roads: '7.8 km', date: 'May 30, 2026', hours: '3 hrs' },
];

interface MappingSubmissionsTabProps {
  onMutated: () => void;
}

export function MappingSubmissionsTab({ onMutated }: MappingSubmissionsTabProps) {
  const { submissions, page, setPage, total, pageSize, updateSubmissionStatus } = useMappingSubmissions(onMutated);
  const [previewRow, setPreviewRow] = useState<MappingSubmissionRow | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

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

      {submissions.length === 0 ? (
        <div className="text-center py-6 text-muted text-[13px]">No pending mapping submissions.</div>
      ) : (
        submissions.map((row) => (
          <div key={row.id} className="grid grid-cols-[1.4fr_0.9fr_0.9fr_1fr_0.8fr_1.1fr] gap-[10px] items-center py-3 border-b border-border last:border-b-0">
            <div
              onClick={row.user_id ? () => setSelectedProfileId(row.user_id) : undefined}
              className={row.user_id ? 'cursor-pointer' : ''}
            >
              <div className={`text-[13px] font-semibold text-text ${row.user_id ? 'hover:underline' : ''}`}>{row.displayName}</div>
              <div className="text-[11.5px] text-muted">{row.displayChapter}</div>
            </div>
            <div className="text-[11.5px] text-muted">{row.buildings != null ? `${row.buildings} buildings` : '-'}</div>
            <div className="text-[11.5px] text-muted">{row.roadsKm != null ? `${row.roadsKm} km` : '-'}</div>
            <div className="text-[11.5px] text-muted">{formatDate(row.submitted_at, '')}</div>
            <div className="font-semibold">{formatHours(row.hours)}</div>
            <div className="flex gap-[6px]">
              <IconButton icon="check" variant="approve" aria-label="Approve" onClick={() => updateSubmissionStatus(row.id, 'approved')} />
              <IconButton icon="x" variant="reject" aria-label="Reject" onClick={() => updateSubmissionStatus(row.id, 'rejected')} />
              <IconButton icon="eye" variant="neutral" aria-label="Preview" onClick={() => setPreviewRow(row)} />
            </div>
          </div>
        ))
      )}

      {submissions.length > 0 ? (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      ) : null}

      <Modal open={previewRow !== null} onClose={() => setPreviewRow(null)} title="Submission Preview" subtitle={previewRow?.displayName ?? ''}>
        {previewRow ? (
          <>
            <div className="flex flex-col gap-[3px] py-[11px] border-b border-border">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">Activity Type</div>
              <div className="text-[14px] text-text font-semibold">{previewRow.activity_type || '-'}</div>
            </div>
            <div className="flex flex-col gap-[3px] py-[11px] border-b border-border">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">Buildings</div>
              <div className="text-[14px] text-text font-semibold">{previewRow.buildings != null ? `${previewRow.buildings} buildings` : '-'}</div>
            </div>
            <div className="flex flex-col gap-[3px] py-[11px] border-b border-border">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">Roads</div>
              <div className="text-[14px] text-text font-semibold">{previewRow.roadsKm != null ? `${previewRow.roadsKm} km` : '-'}</div>
            </div>
            <div className="flex flex-col gap-[3px] py-[11px] border-b border-border">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">Hours</div>
              <div className="text-[14px] text-text font-semibold">{formatHours(previewRow.hours)}</div>
            </div>
            <div className="flex flex-col gap-[3px] py-[11px] border-b border-border">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">Submitted</div>
              <div className="text-[14px] text-text font-semibold">{formatDate(previewRow.submitted_at, '')}</div>
            </div>
            <div className="flex flex-col gap-[3px] py-[11px] last:border-b-0">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">Description</div>
              <div className="text-[14px] text-text font-normal">{previewRow.description || '-'}</div>
            </div>
          </>
        ) : null}
      </Modal>

      <MemberProfileModal profileId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />

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
