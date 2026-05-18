-- Habilitar Supabase Realtime en las tablas que necesitan actualizaciones en tiempo real
-- Usa DO block para ignorar el error si la tabla ya está en la publicación

DO $$
BEGIN
  -- job_posts: trabajadores ven nuevos trabajos publicados
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE job_posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- job_applications: clientes ven nuevas postulaciones, trabajadores ven cambios de estado
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
