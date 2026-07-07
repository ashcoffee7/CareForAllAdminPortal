import { useEffect, useId } from 'react';
import { supabase } from './supabase';

// service_logs rows can be inserted/updated from the member-facing app,
// from this admin portal (another tab, another admin, or this same
// mutation echoing back), or anywhere else with DB access -- Postgres
// changefeeds don't distinguish the source. Callers must pass a stable
// (useCallback'd) function -- a new identity every render would tear
// down and recreate the subscription on every render.
export function useServiceLogsRealtime(onChange: () => void) {
  // supabase.channel(topic) hands back the SAME channel object if a
  // channel with that topic already exists on the client, so a shared
  // literal name breaks the moment two hook instances mount at once (e.g.
  // Overview mounts both the individual and chapter leaderboards) -- the
  // second caller's .on() lands on a channel the first already
  // .subscribe()'d, which supabase-js rejects. A per-instance id keeps
  // every subscriber on its own channel.
  const id = useId();

  useEffect(() => {
    const channel = supabase
      .channel(`service_logs-changes-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_logs' }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange, id]);
}
