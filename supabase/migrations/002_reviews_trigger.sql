-- ============================================================
-- Trigger: recalcular rating y reviews_count en worker_profiles
-- cuando se inserta una reseña en reviews.
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.worker_profiles
  SET
    rating        = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id),
    reviews_count = (SELECT COUNT(*)                       FROM public.reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE user_id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_worker_rating ON public.reviews;

CREATE TRIGGER trg_update_worker_rating
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_worker_rating();
