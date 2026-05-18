-- ============================================================
-- InstaJobs — Migración de producción
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ─── ITEM 1: Columnas faltantes ───────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_token TEXT;

ALTER TABLE public.job_posts
  ADD COLUMN IF NOT EXISTS urgency_detail TEXT;


-- ─── ITEM 4: Correcciones de RLS ──────────────────────────
-- El schema original tenía un bug: los trabajadores podían
-- actualizar el estado de su propia postulación (auto-aceptarse).
-- También se afinan las políticas de job_posts para mayor seguridad.

-- 4.1 job_applications: solo el cliente puede cambiar estado
DROP POLICY IF EXISTS "Workers update own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Clients update application status" ON public.job_applications;

CREATE POLICY "Clients update application status" ON public.job_applications
  FOR UPDATE
  USING (
    auth.uid() = (
      SELECT client_id FROM public.job_posts WHERE id = job_applications.job_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT client_id FROM public.job_posts WHERE id = job_applications.job_id
    )
  );

-- 4.2 job_posts: separar la política FOR ALL en operaciones explícitas
-- (FOR ALL sin WITH CHECK no protege bien el INSERT)
DROP POLICY IF EXISTS "Clients manage own jobs" ON public.job_posts;
DROP POLICY IF EXISTS "Clients can read own cancelled jobs" ON public.job_posts;
DROP POLICY IF EXISTS "Clients can insert own jobs" ON public.job_posts;
DROP POLICY IF EXISTS "Clients can update own jobs" ON public.job_posts;
DROP POLICY IF EXISTS "Clients can delete own jobs" ON public.job_posts;

CREATE POLICY "Clients can read own cancelled jobs" ON public.job_posts
  FOR SELECT USING (true);  -- la política pública ya existe, esto es redundante pero explícito

CREATE POLICY "Clients can insert own jobs" ON public.job_posts
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own jobs" ON public.job_posts
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete own jobs" ON public.job_posts
  FOR DELETE USING (auth.uid() = client_id);

-- 4.3 reviews: el reviewer no puede modificar ni borrar su reseña
DROP POLICY IF EXISTS "Authenticated users can review" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can review new" ON public.reviews;

CREATE POLICY "Authenticated users can review" ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ─── Índice adicional para push_token ────────────────────
CREATE INDEX IF NOT EXISTS idx_users_push_token
  ON public.users(push_token)
  WHERE push_token IS NOT NULL;
