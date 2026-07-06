import { formatDate } from '../../utils/formatDate';
import type { EnrichedChapter } from './useChapterData';

interface ChapterDirectoryProps {
  chapters: EnrichedChapter[];
  searchQuery: string;
}

export function ChapterDirectory({ chapters, searchQuery }: ChapterDirectoryProps) {
  const sorted = [...chapters].sort((a, b) => a.name.localeCompare(b.name));
  const query = searchQuery.trim().toLowerCase();
  const visible = sorted.filter((ch) => ch.name.toLowerCase().includes(query));

  return (
    <>
      <div className="grid grid-cols-[1.7fr_1fr_0.9fr_0.7fr_1.6fr_1.2fr] gap-3 items-center py-[14px] border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Chapter</div>
        <div>Region</div>
        <div>Lead</div>
        <div>Members</div>
        <div>Onboarding Steps</div>
        <div>Created</div>
      </div>

      <div>
        {visible.map((ch) => (
          <div key={ch.id} className="grid grid-cols-[1.7fr_1fr_0.9fr_0.7fr_1.6fr_1.2fr] gap-3 items-center py-[14px] border-b border-border last:border-b-0">
            <div className="text-[13px] font-semibold text-text">{ch.name}</div>
            <div className="text-[11.5px] text-muted">—</div>
            <div className="text-[11.5px] text-muted">{ch.lead}</div>
            <div className="text-[11.5px] text-muted">{ch.memberCount}</div>
            <div className="text-[11.5px] text-muted">—</div>
            <div className="text-[11.5px] text-muted">{formatDate(ch.createdAt)}</div>
          </div>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-5 text-muted text-[13px]">No matches found.</div>
      ) : null}
    </>
  );
}
