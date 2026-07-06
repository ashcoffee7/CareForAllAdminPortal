import { formatDate } from '../../utils/formatDate';
import type { MemberWithChapter } from './useMemberDirectory';

interface MemberDirectoryProps {
  members: MemberWithChapter[];
  searchQuery: string;
}

export function MemberDirectory({ members, searchQuery }: MemberDirectoryProps) {
  const sorted = [...members].sort((a, b) => {
    const nameA = ((a.first_name || '') + ' ' + (a.last_name || '')).trim().toLowerCase();
    const nameB = ((b.first_name || '') + ' ' + (b.last_name || '')).trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const query = searchQuery.trim().toLowerCase();
  const visible = sorted.filter((m) => {
    const name = ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || 'Unknown';
    return name.toLowerCase().includes(query);
  });

  return (
    <>
      <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-[10px] items-center py-3 border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Name</div>
        <div>Chapter</div>
        <div>Joined</div>
      </div>

      <div>
        {visible.map((m) => {
          const name = ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || 'Unknown';
          const chapter = m.chapters?.name || '-';
          return (
            <div
              key={m.id}
              className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-[10px] items-center py-3 border-b border-border last:border-b-0 cursor-pointer rounded-lg transition-colors duration-150 hover:bg-bg"
            >
              <div className="text-[13px] font-semibold text-text">{name}</div>
              <div className="text-[11.5px] text-muted">{chapter}</div>
              <div className="text-[11.5px] text-muted">{formatDate(m.created_at)}</div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-5 text-muted text-[13px]">No matches found.</div>
      ) : null}
    </>
  );
}
