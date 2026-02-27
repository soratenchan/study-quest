'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  event?: RealtimeEvent;
  onEvent: (payload: unknown) => void;
}

export function useRealtime({ table, filter, event = '*', onEvent }: UseRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-${table}-${filter ?? 'all'}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        onEvent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, onEvent]);
}
