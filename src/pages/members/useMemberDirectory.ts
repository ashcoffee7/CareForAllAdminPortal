import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MEMBER_ROLES } from '../../roles';
import type { Profile } from '../../types/database';

export type MemberWithChapter = Pick<
  Profile,
  'id' | 'first_name' | 'last_name' | 'gender' | 'education_level' | 'date_of_birth' | 'chapter_id' | 'created_at'
> & { chapters: { name: string } | null };

interface MembersState {
  members: MemberWithChapter[];
  chapterCount: number | null;
  loading: boolean;
}

export function useMemberDirectory() {
  const [state, setState] = useState<MembersState>({ members: [], chapterCount: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { count: chapterCount, error: chapterErr } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true });
      if (chapterErr) { console.error('chapters count failed:', chapterErr.message, chapterErr.details, chapterErr.hint); }

      const { data: members, error: membersErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, gender, education_level, date_of_birth, chapter_id, created_at, chapters:chapter_id ( name )')
        .in('role', MEMBER_ROLES);

      if (membersErr) {
        console.error('members fetch failed:', membersErr.message, membersErr.details, membersErr.hint);
      }

      if (!cancelled) {
        setState({
          members: membersErr ? [] : (members as unknown as MemberWithChapter[] ?? []),
          chapterCount: chapterCount ?? null,
          loading: false,
        });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
