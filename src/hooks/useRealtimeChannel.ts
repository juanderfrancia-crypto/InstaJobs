import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeChannel(
  channelName: string,
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  onEvent: () => void,
  filter?: string,
) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, ...(filter ? { filter } : {}) },
        () => callbackRef.current(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelName, table, event, filter]);
}
