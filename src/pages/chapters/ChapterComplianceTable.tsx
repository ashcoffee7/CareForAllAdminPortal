import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { StatusPill } from '../../components/StatusPill';
import { IconButton } from '../../components/IconButton';
import { Button } from '../../components/Button';
import { formatDate } from '../../utils/formatDate';
import type { EnrichedChapter, Quarter, QuarterStatus } from './useChapterData';

interface ChapterComplianceTableProps {
  chapters: EnrichedChapter[];
  currentYear: number;
  onUpdateProjectCount: (chapterId: string, value: number | null) => void;
  onMarkQuarterComplete: (chapterName: string, quarter: Quarter) => void;
  onUnmarkQuarterComplete: (checkinId: string) => void;
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

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

export function ChapterComplianceTable({
  chapters,
  currentYear,
  onUpdateProjectCount,
  onMarkQuarterComplete,
  onUnmarkQuarterComplete,
}: ChapterComplianceTableProps) {
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [projectCountDraft, setProjectCountDraft] = useState('');

  const sorted = [...chapters].sort((a, b) => (a.compliant ? 1 : 0) - (b.compliant ? 1 : 0));
  const openChapter = chapters.find((c) => c.id === openChapterId) ?? null;

  function startEditing(ch: EnrichedChapter) {
    setEditingChapterId(ch.id);
    setProjectCountDraft(String(ch.projectCount));
  }

  function saveProjectCount(chapterId: string) {
    const parsed = Number(projectCountDraft);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onUpdateProjectCount(chapterId, Math.round(parsed));
    }
    setEditingChapterId(null);
  }

  function clearOverride(chapterId: string) {
    onUpdateProjectCount(chapterId, null);
    setEditingChapterId(null);
  }

  return (
    <>
      <div className="grid grid-cols-[1.4fr_1.4fr_1.2fr_1.2fr_1fr] gap-3 items-center py-[14px] border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Chapter</div>
        <div>Chapter Lead</div>
        <div>Projects (2+/yr)</div>
        <div>Quarterly Check-Ins</div>
        <div>Status</div>
      </div>

      <div>
        {sorted.map((ch) => (
          <div key={ch.id} className="grid grid-cols-[1.4fr_1.4fr_1.2fr_1.2fr_1fr] gap-3 items-center py-[14px] border-b border-border last:border-b-0">
            <div className="text-[13px] font-semibold text-text">{ch.name}</div>
            <div className="text-[11.5px] text-muted">{ch.lead}</div>

            {editingChapterId === ch.id ? (
              <div className="flex items-center gap-[6px]">
                <input
                  type="number"
                  min={0}
                  autoFocus
                  value={projectCountDraft}
                  onChange={(e) => setProjectCountDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { saveProjectCount(ch.id); } if (e.key === 'Escape') { setEditingChapterId(null); } }}
                  className="w-[56px] px-2 py-1 border border-border rounded-md text-[12px] text-text bg-white outline-none focus:border-brand"
                />
                <IconButton icon="check" variant="approve" aria-label="Save" onClick={() => saveProjectCount(ch.id)} className="w-[24px] h-[24px]" />
                <IconButton icon="x" variant="reject" aria-label="Cancel" onClick={() => setEditingChapterId(null)} className="w-[24px] h-[24px]" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-text">
                <span className={`w-[10px] h-[10px] rounded-full shrink-0 ${ch.projectCount >= 2 ? 'bg-success' : 'bg-accent'}`} />
                {ch.projectCount} / 2
                {ch.projectCountIsOverride ? (
                  <button
                    type="button"
                    title="Reset to auto-calculated count"
                    onClick={() => clearOverride(ch.id)}
                    className="text-[10px] font-bold text-muted normal-case bg-none border-none cursor-pointer p-0 hover:text-brand hover:underline"
                  >
                    (manual — reset)
                  </button>
                ) : null}
                <IconButton icon="pencil" variant="neutral" aria-label="Edit project count" onClick={() => startEditing(ch)} className="w-[24px] h-[24px]" />
              </div>
            )}

            <div onClick={() => setOpenChapterId(ch.id)} className="flex gap-[5px] cursor-pointer [&:hover>div]:opacity-80">
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
        onClose={() => setOpenChapterId(null)}
        title="Quarterly Check-In Responses"
        subtitle={openChapter?.name}
      >
        {openChapter
          ? QUARTERS.map((q) => {
              const submitted = openChapter.checkins.find(
                (c) => c.quarter === q && new Date(c.submitted_at).getFullYear() === currentYear
              );

              return (
                <div key={q} className="py-[11px] border-b border-border last:border-b-0">
                  <div className="flex items-center justify-between gap-3 mb-[6px]">
                    <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">
                      {q} {currentYear}
                      {submitted ? ` — Submitted ${formatDate(submitted.submitted_at)}` : ' — Not submitted'}
                    </div>
                    {submitted ? (
                      <Button variant="danger" className="!text-[11px] !px-3 !py-[5px]" onClick={() => onUnmarkQuarterComplete(submitted.id)}>
                        Remove
                      </Button>
                    ) : (
                      <Button variant="outline" className="!text-[11px] !px-3 !py-[5px]" onClick={() => onMarkQuarterComplete(openChapter.name, q)}>
                        Mark Complete
                      </Button>
                    )}
                  </div>
                  {submitted ? (
                    <div className="text-[14px] text-text">
                      <strong>Member Count:</strong> {submitted.member_count != null ? submitted.member_count : '-'}<br />
                      <strong>Activities:</strong> {submitted.activities || '-'}<br />
                      <strong>Challenges:</strong> {submitted.challenges || '-'}
                    </div>
                  ) : null}
                </div>
              );
            })
          : null}
      </Modal>
    </>
  );
}
