import { useEffect, useState } from 'react';
import { api, apiOrToast, mutateOrToast } from '../../lib/apiClient';
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
      const [mentorsResult, sessionsResult] = await Promise.all([
        apiOrToast(api.get<{ data: Mentor[] }>('/mentors'), 'Loading mentors', { data: [] }),
        apiOrToast(api.get<{ total: number }>('/mentorship-sessions'), 'Loading session count', { total: 0 }),
      ]);

      if (!cancelled) {
        setState({ mentors: mentorsResult.data, sessionCount: sessionsResult.total, loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function setMentorAvailability(mentorId: string, available: boolean) {
    const ok = await mutateOrToast(api.patch(`/mentors/${mentorId}`, { available }), 'Updating mentor availability');
    if (!ok) { return; }

    setState((prev) => ({
      ...prev,
      mentors: prev.mentors.map((m) => (m.id === mentorId ? { ...m, available } : m)),
    }));
  }

  return { ...state, setMentorAvailability };
}
