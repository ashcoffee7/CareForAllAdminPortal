import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import { api, apiOrToast } from '../lib/apiClient';
import { formatDate } from '../utils/formatDate';
import { ageFromDob } from '../utils/age';

interface MemberProfile {
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  education_level: string | null;
  date_of_birth: string | null;
  created_at: string;
  email: string | null;
}

interface MemberProfileModalProps {
  profileId: string | null;
  onClose: () => void;
}

const NOT_SPECIFIED = 'Not specified';

function initialsFor(firstName: string | null, lastName: string | null): string {
  const initials = (firstName?.[0] ?? '') + (lastName?.[0] ?? '');
  return initials.toUpperCase() || '?';
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-[3px] py-[11px] border-b border-border last:border-b-0">
      <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">{label}</div>
      <div className="text-[14px] text-text font-semibold">{value || NOT_SPECIFIED}</div>
    </div>
  );
}

// Shared between the Service Hours Leaderboard and the Member Directory --
// both just need a profileId to open this against. Fetches on open rather
// than requiring every list row to carry full profile detail up front.
export function MemberProfileModal({ profileId, onClose }: MemberProfileModalProps) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) { setProfile(null); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const result = await apiOrToast(
        api.get<{ data: MemberProfile }>(`/profiles/${profileId}`),
        'Loading member profile',
        null
      );
      if (!cancelled) {
        setProfile(result?.data ?? null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profileId]);

  const fullName = profile ? ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim() || 'Unknown' : '';

  return (
    <Modal open={profileId !== null} onClose={onClose} title="Member Profile" subtitle={fullName}>
      {loading || !profile ? (
        <div className="text-center py-6 text-muted text-[13px]">{loading ? 'Loading…' : 'Could not load this profile.'}</div>
      ) : (
        <>
          <div className="flex items-center gap-3 pb-[14px] border-b border-border">
            <Avatar initial={initialsFor(profile.first_name, profile.last_name)} size={48} />
            <div className="text-[15px] font-bold text-text">{fullName}</div>
          </div>
          <Field label="Age" value={profile.date_of_birth ? String(ageFromDob(profile.date_of_birth)) : null} />
          <Field label="Gender" value={profile.gender} />
          <Field label="School Level" value={profile.education_level} />
          <Field label="Joined CareForAll" value={formatDate(profile.created_at, '')} />
          <Field label="Email" value={profile.email} />
        </>
      )}
    </Modal>
  );
}
