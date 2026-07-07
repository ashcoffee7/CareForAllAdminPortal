import { useEffect } from 'react';
import { supabase } from './supabase';

// service_logs rows can be inserted/updated from the member-facing app,
// from this admin portal (another tab, another admin, or this same
// mutation echoing back), or anywhere else with DB access -- Postgres
// changefeeds don't distinguish the source. Callers must pass a stable
// (useCallback'd) function -- a new identity every render would tear
// down and recreate the subscription on every render.
export function useServiceLogsRealtime(onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('service_logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_logs' }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
