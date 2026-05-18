import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchUnreadCount } from '@/services';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try {
      const n = await fetchUnreadCount(user.id);
      setCount(n);
    } catch { /* best-effort */ }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Suscripción en tiempo real para INSERT y UPDATE en la tabla notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notif_count_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  return count;
}
