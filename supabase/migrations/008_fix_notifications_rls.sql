-- Fix: separar política RLS de notifications para permitir INSERT cross-user
-- El problema: la política FOR ALL solo permite operar sobre filas donde auth.uid() = user_id,
-- pero las notificaciones se insertan desde el dispositivo del EMISOR, no del receptor.

DROP POLICY IF EXISTS "notifications_own" ON notifications;

-- Cualquier usuario autenticado puede enviar notificaciones a otro usuario
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo el dueño puede leer sus propias notificaciones
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el dueño puede marcarlas como leídas
CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Solo el dueño puede borrarlas
CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
