-- Trigger: incrementa jobs_completed en worker_profiles cuando un trabajo se marca como completado

CREATE OR REPLACE FUNCTION increment_worker_jobs_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.worker_profiles wp
    SET jobs_completed = COALESCE(jobs_completed, 0) + 1
    FROM public.job_applications ja
    WHERE ja.job_id = NEW.id
      AND ja.status = 'accepted'
      AND wp.user_id = ja.worker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_job_completed ON public.job_posts;
CREATE TRIGGER on_job_completed
  AFTER UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_worker_jobs_completed();

-- Backfill: actualiza jobs_completed para trabajos que ya fueron completados
UPDATE public.worker_profiles wp
SET jobs_completed = sub.completed_count
FROM (
  SELECT ja.worker_id, COUNT(*) AS completed_count
  FROM public.job_applications ja
  JOIN public.job_posts jp ON jp.id = ja.job_id
  WHERE ja.status = 'accepted'
    AND jp.status = 'completed'
  GROUP BY ja.worker_id
) sub
WHERE wp.user_id = sub.worker_id;
