import { supabase } from './supabase';
import { storeNotification } from '@/services/notificationService';

export async function sendPushNotification(
  toUserId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  try {
    // Guardar en historial in-app (best-effort)
    await storeNotification(toUserId, title, body, data ?? {});
    // Enviar push notification
    await supabase.functions.invoke('send-notification', {
      body: { to_user_id: toUserId, title, body, data: data ?? {} },
    });
  } catch {
    // Las notificaciones son best-effort — nunca bloquear el flujo principal
  }
}
