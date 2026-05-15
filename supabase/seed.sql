-- ============================================================
-- InstaJobs — Datos de prueba
-- Ejecutar DESPUÉS del schema.sql
-- NOTA: Ajusta los UUIDs a usuarios reales de tu proyecto
-- ============================================================

-- Trabajadores de ejemplo (reemplaza los UUIDs con IDs reales de auth.users)
-- Para probar sin auth, puedes deshabilitar RLS temporalmente:
-- alter table public.worker_profiles disable row level security;

/*
insert into public.users (id, phone, full_name, role, municipality, verified_phone, verified_id)
values
  ('00000000-0000-0000-0000-000000000001', '3101111111', 'Jorge Molina Pérez', 'worker', 'Rionegro', true, true),
  ('00000000-0000-0000-0000-000000000002', '3102222222', 'Luis Gómez Arbeláez', 'worker', 'Rionegro', true, false),
  ('00000000-0000-0000-0000-000000000003', '3103333333', 'Carlos Ríos Zapata', 'worker', 'La Ceja', true, true),
  ('00000000-0000-0000-0000-000000000010', '3109999999', 'Ana Martínez López', 'client', 'Rionegro', true, false);

insert into public.worker_profiles
  (user_id, trades, bio, experience_years, whatsapp_number, available, municipality, full_name, rating, reviews_count, jobs_completed)
values
  ('00000000-0000-0000-0000-000000000001',
   array['plomeria', 'albanileria'],
   'Plomero con 8 años de experiencia en instalaciones residenciales. Trabajo en toda la zona del oriente antioqueño. Garantizo mis trabajos.',
   8, '3101111111', true, 'Rionegro', 'Jorge Molina Pérez', 4.9, 38, 41),
  ('00000000-0000-0000-0000-000000000002',
   array['electricidad'],
   'Electricista certificado por el SENA. Instalaciones, mantenimiento y reparaciones eléctricas residenciales y comerciales.',
   12, '3102222222', false, 'Rionegro', 'Luis Gómez Arbeláez', 4.8, 52, 58),
  ('00000000-0000-0000-0000-000000000003',
   array['albanileria', 'repello', 'construccion'],
   'Albañil con experiencia en repello, construcción menor, arreglos de grietas y humedades.',
   6, '3103333333', true, 'La Ceja', 'Carlos Ríos Zapata', 4.6, 21, 24);

insert into public.job_posts
  (client_id, trade_category, title, description, municipality, urgency, budget_min, budget_max, status)
values
  ('00000000-0000-0000-0000-000000000010',
   'plomeria', 'Reparación tubería bajo lavaplatos',
   'Tengo una tubería rota bajo el lavaplatos de la cocina. Hay fuga de agua. Necesito que venga hoy o mañana.',
   'Rionegro', 'today', 50000, 120000, 'open'),
  ('00000000-0000-0000-0000-000000000010',
   'pintura', 'Pintar habitación principal',
   'Habitación de 4x4 metros. Las paredes están en buen estado, solo necesito pintura. Yo pongo los materiales.',
   'Rionegro', 'week', 80000, 150000, 'open');
*/

-- Para probar la app, crea usuarios desde la interfaz de Supabase Auth
-- o usa el flujo de OTP en la app misma.
select 'Datos de prueba listos. Descomenta el bloque INSERT cuando tengas usuarios reales.' as mensaje;
