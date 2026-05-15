import { supabase } from './supabase';

export async function sendPushNotification(
  toUserId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  try {
    await supabase.functions.invoke('send-notification', {
      body: { to_user_id: toUserId, title, body, data: data ?? {} },
    });
  } catch {
    // Las notificaciones son best-effort — nunca bloquear el flujo principal
  }
}
