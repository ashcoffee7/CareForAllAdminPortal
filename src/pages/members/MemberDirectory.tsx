import { useState } from 'react';
import { formatDate } from '../../utils/formatDate';
import { Pagination } from '../../components/Pagination';
import { MemberProfileModal } from '../../components/MemberProfileModal';
import type { MemberDirectoryRow } from './useMemberDirectory';

interface MemberDirectoryProps {
  members: MemberDirectoryRow[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Sorting, searching, and pagination all happen server-side now (see
// useMemberDirectory) -- this just renders whatever page it's given.
export function MemberDirectory({ members, page, pageSize, total, onPageChange }: MemberDirectoryProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-[10px] items-center py-3 border-b border-border [&>div]:text-[11px] [&>div]:font-bold [&>div]:text-muted [&>div]:uppercase [&>div]:tracking-[0.05em]">
        <div>Name</div>
        <div>Chapter</div>
        <div>Joined</div>
      </div>

      <div>
        {members.map((m) => {
          const name = ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || 'Unknown';
          const chapter = m.chapters?.name || '-';
          return (
            <div
              key={m.id}
              onClick={() => setSelectedProfileId(m.id)}
              className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-[10px] items-center py-3 border-b border-border last:border-b-0 cursor-pointer rounded-lg transition-colors duration-150 hover:bg-bg"
            >
              <div className="text-[13px] font-semibold text-text">{name}</div>
              <div className="text-[11.5px] text-muted">{chapter}</div>
              <div className="text-[11.5px] text-muted">{formatDate(m.created_at)}</div>
            </div>
          );
        })}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-5 text-muted text-[13px]">No matches found.</div>
      ) : (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      )}

      <MemberProfileModal profileId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
    </>
  );
}
