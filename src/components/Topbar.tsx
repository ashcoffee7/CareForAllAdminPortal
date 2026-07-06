import { useAuth } from '../routes/AuthContext';
import { Avatar } from './Avatar';

interface TopbarProps {
  title: string;
  // Only the Overview page's topbar showed the avatar+name chip in the
  // original markup -- every other page's topbar is just the title.
  showUserChip?: boolean;
}

export function Topbar({ title, showUserChip = false }: TopbarProps) {
  const admin = useAuth();

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="font-heading text-[28px] text-brand tracking-[0.01em]">{title}</div>
        <span className="inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-[6px] bg-sidebar text-white text-[10px] font-bold tracking-[0.06em] uppercase">
          <i className="ti ti-shield-lock text-[11px]" />
          Admin Only
        </span>
      </div>
      {showUserChip ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-[6px] pr-3 py-1 bg-card border border-border rounded-full text-[13px] text-text font-medium cursor-pointer">
            <Avatar initial={admin?.initial ?? 'A'} size={26} />
            <span>{admin?.fullName ?? ''}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
