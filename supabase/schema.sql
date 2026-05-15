-- ============================================================
-- InstaJobs — Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. USUARIOS
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text unique,
  full_name       text not null,
  role            text not null check (role in ('client', 'worker')),
  municipality    text not null,
  avatar_url      text,
  verified_phone  boolean default false,
  verified_id     boolean default false,
  created_at      timestamptz default now()
);

-- 2. PERFILES DE TRABAJADORES
create table if not exists public.worker_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.users(id) on delete cascade unique,
  trades            text[] not null default '{}',
  bio               text default '',
  experience_years  int default 0,
  whatsapp_number   text not null,
  available         boolean default true,
  membership_tier   text default 'free' check (membership_tier in ('free', 'premium')),
  photos            text[] default '{}',
  municipality      text not null,
  full_name         text not null,
  avatar_url        text,
  rating            numeric(3,2) default 0,
  reviews_count     int default 0,
  jobs_completed    int default 0,
  created_at        timestamptz default now()
);

-- 3. PUBLICACIONES DE TRABAJO
create table if not exists public.job_posts (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references public.users(id) on delete cascade,
  trade_category    text not null,
  title             text not null,
  description       text not null,
  municipality      text not null,
  urgency           text default 'flexible' check (urgency in ('today', 'week', 'flexible')),
  budget_min        int,
  budget_max        int,
  status            text default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  photos            text[] default '{}',
  applications_count int default 0,
  created_at        timestamptz default now()
);

-- 4. APLICACIONES / SOLICITUDES
create table if not exists public.job_applications (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references public.job_posts(id) on delete cascade,
  worker_id   uuid references public.users(id) on delete cascade,
  message     text not null,
  status      text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at  timestamptz default now(),
  unique(job_id, worker_id)
);

-- 5. CALIFICACIONES Y RESEÑAS
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references public.job_posts(id) on delete cascade,
  reviewer_id   uuid references public.users(id) on delete cascade,
  reviewed_id   uuid references public.users(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  comment       text not null,
  created_at    timestamptz default now(),
  unique(job_id, reviewer_id)
);

-- ============================================================
-- ÍNDICES para búsquedas frecuentes
-- ============================================================
create index if not exists idx_worker_profiles_municipality on public.worker_profiles(municipality);
create index if not exists idx_worker_profiles_trades on public.worker_profiles using gin(trades);
create index if not exists idx_job_posts_municipality on public.job_posts(municipality);
create index if not exists idx_job_posts_category on public.job_posts(trade_category);
create index if not exists idx_job_posts_status on public.job_posts(status);
create index if not exists idx_job_posts_created on public.job_posts(created_at desc);
create index if not exists idx_reviews_reviewed on public.reviews(reviewed_id);

-- ============================================================
-- TRIGGER: actualizar rating automáticamente al agregar reseña
-- ============================================================
create or replace function update_worker_rating()
returns trigger as $$
begin
  update public.worker_profiles
  set
    rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where reviewed_id = NEW.reviewed_id
    ),
    reviews_count = (
      select count(*)
      from public.reviews
      where reviewed_id = NEW.reviewed_id
    )
  where user_id = NEW.reviewed_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_review_insert
after insert on public.reviews
for each row execute function update_worker_rating();

-- ============================================================
-- TRIGGER: incrementar contador de aplicaciones
-- ============================================================
create or replace function increment_applications_count()
returns trigger as $$
begin
  update public.job_posts
  set applications_count = applications_count + 1
  where id = NEW.job_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_application_insert
after insert on public.job_applications
for each row execute function increment_applications_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.users enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.job_applications enable row level security;
alter table public.reviews enable row level security;

-- Users: cada usuario ve su propio perfil; todos ven perfiles de trabajadores
create policy "Users can view all profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Worker profiles: públicos para lectura
create policy "Worker profiles are public" on public.worker_profiles for select using (true);
create policy "Workers manage own profile" on public.worker_profiles for all using (auth.uid() = user_id);

-- Job posts: públicos para lectura
create policy "Job posts are public" on public.job_posts for select using (true);
create policy "Clients manage own jobs" on public.job_posts for all using (auth.uid() = client_id);

-- Applications
create policy "Workers see own applications" on public.job_applications for select
  using (auth.uid() = worker_id or auth.uid() = (select client_id from public.job_posts where id = job_id));
create policy "Workers can apply" on public.job_applications for insert with check (auth.uid() = worker_id);
create policy "Workers update own applications" on public.job_applications for update using (auth.uid() = worker_id);

-- Reviews: públicas para lectura
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Authenticated users can review" on public.reviews for insert with check (auth.uid() = reviewer_id);
