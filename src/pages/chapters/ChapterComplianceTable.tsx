import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { StatusPill } from '../../components/StatusPill';
import { formatDate } from '../../utils/formatDate';
import type { EnrichedChapter, QuarterStatus } from './useChapterData';

interface ChapterComplianceTableProps {
  chapters: EnrichedChapter[];
}

const DOT_CLASS: Record<QuarterStatus, string> = {
  done: 'bg-success-light text-success-dark',
  overdue: 'bg-danger-light text-danger-dark',
  pending: 'bg-border text-muted',
};

const DOT_TITLE: Record<QuarterStatus, string> = {
  done: 'Submitted',
  overdue: 'Overdue',
  pending: 'Not yet due',
};

export function ChapterComplianceTable({ chapters }: ChapterComplianceTableProps) {
  const [openChapter, setOpenChapter] = useState<EnrichedChapter | null>(null);

  const sorted = [...chapters].sort((a, b) => (a.compliant ? 1 : 0) - (b.compliant ? 1 : 0));

  return (
    <>
      <div className="grid grid-cols-[1.4fr_1.4fr_1fr_1.2fr_1fr] gap-3 items-center py-[14px] border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Chapter</div>
        <div>Chapter Lead</div>
        <div>Projects (2+/yr)</div>
        <div>Quarterly Check-Ins</div>
        <div>Status</div>
      </div>

      <div>
        {sorted.map((ch) => (
          <div key={ch.id} className="grid grid-cols-[1.4fr_1.4fr_1fr_1.2fr_1fr] gap-3 items-center py-[14px] border-b border-border last:border-b-0">
            <div className="text-[13px] font-semibold text-text">{ch.name}</div>
            <div className="text-[11.5px] text-muted">{ch.lead}</div>
            <div className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-text">
              <span className={`w-[10px] h-[10px] rounded-full shrink-0 ${ch.projectCount >= 2 ? 'bg-success' : 'bg-accent'}`} />
              {ch.projectCount} / 2
            </div>
            <div onClick={() => setOpenChapter(ch)} className="flex gap-[5px] cursor-pointer [&:hover>div]:opacity-80">
              {ch.quarterStatuses.map((status, i) => (
                <div
                  key={i}
                  title={DOT_TITLE[status]}
                  className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[10px] font-bold ${DOT_CLASS[status]}`}
                >
                  Q{i + 1}
                </div>
              ))}
            </div>
            <div>
              <StatusPill variant={ch.compliant ? 'success' : 'danger'}>
                {ch.compliant ? 'Compliant' : 'Non-Compliant'}
              </StatusPill>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={openChapter !== null}
        onClose={() => setOpenChapter(null)}
        title="Quarterly Check-In Responses"
        subtitle={openChapter?.name}
      >
        {openChapter && openChapter.checkins.length === 0 ? (
          <div className="text-center py-5 text-muted text-[13px]">No check-ins submitted yet.</div>
        ) : (
          openChapter?.checkins.map((c) => (
            <div key={c.id} className="py-[11px] border-b border-border last:border-b-0">
              <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">
                {c.quarter || '-'} — Submitted {formatDate(c.submitted_at)}
              </div>
              <div className="text-[14px] text-text mt-[6px]">
                <strong>Member Count:</strong> {c.member_count != null ? c.member_count : '-'}<br />
                <strong>Activities:</strong> {c.activities || '-'}<br />
                <strong>Challenges:</strong> {c.challenges || '-'}
              </div>
            </div>
          ))
        )}
      </Modal>
    </>
  );
}
