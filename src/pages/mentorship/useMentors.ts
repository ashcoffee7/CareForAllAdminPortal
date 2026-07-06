import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Mentor } from '../../types/database';

interface MentorshipState {
  mentors: Mentor[];
  sessionCount: number | null;
  loading: boolean;
}

export function useMentors() {
  const [state, setState] = useState<MentorshipState>({ mentors: [], sessionCount: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: mentors, error: mentorsErr } = await supabase
        .from('mentors')
        .select('id, name, calendly_link, available')
        .order('name');

      if (mentorsErr) {
        console.error('mentors fetch failed:', mentorsErr.message, mentorsErr.details, mentorsErr.hint);
      }

      const { count: sessionCount, error: sessionsErr } = await supabase
        .from('mentorship_sessions')
        .select('*', { count: 'exact', head: true });

      if (sessionsErr) {
        console.error('mentorship_sessions fetch failed:', sessionsErr.message, sessionsErr.details, sessionsErr.hint);
      }

      if (!cancelled) {
        setState({ mentors: mentorsErr ? [] : (mentors ?? []), sessionCount: sessionCount ?? null, loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function setMentorAvailability(mentorId: string, available: boolean) {
    const { error } = await supabase.from('mentors').update({ available }).eq('id', mentorId);

    if (error) {
      console.error('mentor availability update failed:', error.message, error.details, error.hint);
      alert('Could not update mentor availability:\n' + error.message);
      return;
    }

    setState((prev) => ({
      ...prev,
      mentors: prev.mentors.map((m) => (m.id === mentorId ? { ...m, available } : m)),
    }));
  }

  return { ...state, setMentorAvailability };
}
