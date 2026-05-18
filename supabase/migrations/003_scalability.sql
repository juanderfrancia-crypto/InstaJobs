-- ============================================================
-- InstaJobs — Migración de escalabilidad
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ─── 1. RLS: workers pueden cancelar sus propias aplicaciones pendientes ───
DROP POLICY IF EXISTS "Workers can cancel pending applications" ON public.job_applications;
CREATE POLICY "Workers can cancel pending applications" ON public.job_applications
  FOR DELETE USING (
    auth.uid() = worker_id
    AND status = 'pending'
  );

-- ─── 2. Trigger: auto-rechazar otras aplicaciones al aceptar una ───────────
CREATE OR REPLACE FUNCTION auto_reject_others_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE public.job_applications
    SET status = 'rejected'
    WHERE job_id = NEW.job_id
      AND id     != NEW.id
      AND status  = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_reject_others ON public.job_applications;
CREATE TRIGGER trg_auto_reject_others
AFTER UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION auto_reject_others_on_accept();

-- ─── 3. Trigger: decrementar applications_count al borrar una aplicación ───
CREATE OR REPLACE FUNCTION decrement_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.job_posts
  SET applications_count = GREATEST(0, applications_count - 1)
  WHERE id = OLD.job_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_decrement_app_count ON public.job_applications;
CREATE TRIGGER trg_decrement_app_count
AFTER DELETE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION decrement_applications_count();

-- ─── 4. Índices compuestos para queries frecuentes ─────────────────────────

-- Búsqueda de trabajos por municipio + estado (HomeScreen, SearchScreen)
CREATE INDEX IF NOT EXISTS idx_job_posts_muni_status
  ON public.job_posts(municipality, status);

-- Búsqueda por estado + categoría (filtros de búsqueda)
CREATE INDEX IF NOT EXISTS idx_job_posts_status_category
  ON public.job_posts(status, trade_category);

-- Trabajos de un cliente ordenados por fecha (MyActivityScreen)
CREATE INDEX IF NOT EXISTS idx_job_posts_client_created
  ON public.job_posts(client_id, created_at DESC);

-- Trabajadores disponibles por municipio (HomeScreen, SearchScreen)
CREATE INDEX IF NOT EXISTS idx_worker_profiles_muni_available
  ON public.worker_profiles(municipality, available);

-- Trabajadores ordenados por tier y rating (premium primero, luego mejor calificados)
CREATE INDEX IF NOT EXISTS idx_worker_profiles_tier_rating
  ON public.worker_profiles(membership_tier DESC, rating DESC NULLS LAST);

-- Aplicaciones de un trabajador (MyApplicationsScreen, ChatsScreen)
CREATE INDEX IF NOT EXISTS idx_job_applications_worker_id
  ON public.job_applications(worker_id);

-- Aplicaciones de un trabajo filtradas por estado (JobApplicationsScreen)
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status
  ON public.job_applications(job_id, status);

-- ─── 5. Actualizar datos inconsistentes ya existentes ──────────────────────
-- Recalcula applications_count para todos los jobs activos
UPDATE public.job_posts j
SET applications_count = (
  SELECT COUNT(*) FROM public.job_applications a WHERE a.job_id = j.id
)
WHERE j.status IN ('open', 'in_progress');
