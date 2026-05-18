-- Permite publicar trabajos con varias vacantes
ALTER TABLE public.job_posts
  ADD COLUMN IF NOT EXISTS workers_needed INT NOT NULL DEFAULT 1
    CHECK (workers_needed BETWEEN 1 AND 50);

-- Actualizar el trigger de auto-rechazo:
-- antes rechazaba siempre al aceptar uno;
-- ahora solo rechaza cuando ya se cubrieron todas las vacantes.
CREATE OR REPLACE FUNCTION auto_reject_others_on_accept()
RETURNS TRIGGER AS $$
DECLARE
  needed   INT;
  accepted INT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    SELECT workers_needed INTO needed
      FROM public.job_posts WHERE id = NEW.job_id;

    SELECT COUNT(*) INTO accepted
      FROM public.job_applications
      WHERE job_id = NEW.job_id AND status = 'accepted';

    IF accepted >= needed THEN
      UPDATE public.job_applications
        SET status = 'rejected'
        WHERE job_id = NEW.job_id
          AND id     != NEW.id
          AND status  = 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
