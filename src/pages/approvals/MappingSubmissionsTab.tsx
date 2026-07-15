import { useState } from 'react';
import { Card } from '../../components/Card';
import { IconButton } from '../../components/IconButton';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { MemberProfileModal } from '../../components/MemberProfileModal';
import { formatDate } from '../../utils/formatDate';
import { formatHours } from '../../utils/formatHours';
import { useMappingSubmissions, type MappingSubmissionRow } from './useMappingSubmissions';

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
    </Card>
  );
}
