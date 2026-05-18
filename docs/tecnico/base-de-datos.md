# Base de Datos — InstaJobs (Supabase / PostgreSQL)

**Versión:** 2.0  
**Fecha:** Mayo 2026

---

## Tablas y vistas

### `users`
Extiende `auth.users` de Supabase. Se crea en el onboarding.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Mismo ID de `auth.users` |
| `phone` | text | Número con código país (+57XXXXXXXXXX) |
| `full_name` | text | Nombre completo |
| `role` | text | `'client'` o `'worker'` |
| `municipality` | text | Municipio del usuario |
| `avatar_url` | text | URL de foto de perfil en Storage |
| `verified_phone` | boolean | Siempre `true` tras OTP exitoso |
| `verified_id` | boolean | Verificación de cédula (default `false`) |
| `push_token` | text | Token de Expo Push Notifications |
| `created_at` | timestamptz | Auto |

> **Nota de seguridad:** `phone` y `push_token` son privados. Para leer datos de otros usuarios usar la vista `users_public`.

---

### `users_public` (vista)
Vista de `users` sin campos sensibles. Acceso público para todos los usuarios autenticados.

| Columna | Descripción |
|---|---|
| `id` | UUID del usuario |
| `full_name` | Nombre completo |
| `role` | `'client'` o `'worker'` |
| `municipality` | Municipio |
| `avatar_url` | URL de foto |
| `verified_phone` | Verificación de celular |
| `verified_id` | Verificación de cédula |
| `created_at` | Fecha de registro |

---

### `worker_profiles`
Perfil extendido del trabajador. Solo existe si `role = 'worker'`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id) | UNIQUE |
| `full_name` | text | Duplicado de users para queries rápidas |
| `municipality` | text | Duplicado para filtros geográficos |
| `trades` | text[] | Array de IDs de categorías |
| `bio` | text | Descripción del trabajador |
| `experience_years` | integer | Años de experiencia |
| `whatsapp_number` | text | Número sin código país |
| `available` | boolean | Toggle de disponibilidad |
| `membership_tier` | text | `'free'` o `'premium'` |
| `photos` | text[] | URLs de fotos del portafolio |
| `avatar_url` | text | URL de foto de perfil |
| `rating` | numeric(3,2) | Promedio de calificaciones |
| `reviews_count` | integer | Total de reseñas |
| `jobs_completed` | integer | Total de trabajos completados |
| `created_at` | timestamptz | Auto |

---

### `job_posts`
Publicaciones de trabajo creadas por clientes.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `client_id` | UUID (FK → users.id) | |
| `trade_category` | text | ID de categoría (ej: `'plomeria'`) |
| `title` | text | Título corto del trabajo |
| `description` | text | Descripción detallada |
| `municipality` | text | Ubicación del trabajo |
| `urgency` | text | `'today'`, `'week'` o `'flexible'` |
| `urgency_detail` | text | Detalle adicional de urgencia |
| `budget_min` | integer | Presupuesto mínimo (COP), nullable |
| `budget_max` | integer | Presupuesto máximo (COP), nullable |
| `status` | text | `'open'`, `'in_progress'`, `'completed'`, `'cancelled'` |
| `photos` | text[] | URLs de fotos del trabajo |
| `applications_count` | integer | Contador de postulaciones (auto) |
| `created_at` | timestamptz | Auto |

---

### `job_applications`
Postulaciones de trabajadores a publicaciones. Constraint único: `(job_id, worker_id)`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `job_id` | UUID (FK → job_posts.id) | |
| `worker_id` | UUID (FK → users.id) | |
| `message` | text | Mensaje de presentación del trabajador |
| `status` | text | `'pending'`, `'accepted'`, `'rejected'` |
| `created_at` | timestamptz | Auto |

---

### `reviews`
Calificaciones y reseñas post-trabajo. Inmutables una vez creadas (sin UPDATE ni DELETE).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `job_id` | UUID (FK → job_posts.id) | |
| `reviewer_id` | UUID (FK → users.id) | Quien califica |
| `reviewed_id` | UUID (FK → users.id) | Quien es calificado |
| `rating` | integer | 1 a 5 estrellas |
| `comment` | text | Comentario de la reseña |
| `created_at` | timestamptz | Auto |

Constraint único: `(job_id, reviewer_id)` — solo una reseña por trabajo por persona.

---

### `notifications`
Notificaciones in-app por usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → auth.users.id) | Destinatario |
| `title` | text | Título de la notificación |
| `body` | text | Cuerpo del mensaje |
| `data` | JSONB | Datos de navegación (`screen`, `jobId`, etc.) |
| `read` | boolean | Default `false` |
| `created_at` | timestamptz | Auto |

---

## Relaciones clave

```
auth.users
    └── users (1:1)
            ├── worker_profiles (1:1, solo si role='worker')
            ├── job_posts (1:N, solo si role='client')
            ├── job_applications (1:N, solo si role='worker')
            ├── reviews (1:N como reviewer o reviewed)
            └── notifications (1:N)

job_posts
    └── job_applications (1:N)
            └── reviews (1:1 por job+reviewer)
```

---

## Triggers automáticos

| Trigger | Tabla | Evento | Efecto |
|---|---|---|---|
| `trg_update_worker_rating` | `reviews` | AFTER INSERT | Recalcula `rating` y `reviews_count` en `worker_profiles` |
| `on_application_insert` | `job_applications` | AFTER INSERT | Incrementa `applications_count` en `job_posts` |
| `trg_decrement_app_count` | `job_applications` | AFTER DELETE | Decrementa `applications_count` |
| `trg_auto_reject_others` | `job_applications` | AFTER UPDATE (aceptar) | Auto-rechaza las demás postulaciones pendientes del mismo trabajo |

---

## Row Level Security (RLS)

| Tabla / Vista | Lectura | Escritura |
|---|---|---|
| `users` | Solo el propio registro | Solo el propio usuario (UPDATE/INSERT) |
| `users_public` | Todos los autenticados | Solo lectura (es una vista) |
| `worker_profiles` | Público | Solo el propio trabajador |
| `job_posts` | Público | Solo el cliente dueño (INSERT/UPDATE/DELETE) |
| `job_applications` | Trabajador propio + cliente del job | Trabajador: INSERT y DELETE (solo pendientes). Cliente: UPDATE (aceptar/rechazar) |
| `reviews` | Público | Solo INSERT — el reviewer del job. Sin UPDATE ni DELETE |
| `notifications` | Solo el propio usuario | Solo el propio usuario |

**Regla crítica de seguridad:** Los trabajadores **no pueden** cambiar el estado de su propia postulación — solo el cliente dueño del trabajo puede aceptar o rechazar.

---

## Nota importante sobre joins

`job_applications.worker_id` tiene FK a `users.id`, **no** a `worker_profiles.user_id`.

Para obtener datos de `worker_profiles` desde `job_applications` se requiere una query en dos pasos:

```ts
// ✅ Correcto — dos queries separadas
const { data: apps } = await supabase
  .from('job_applications')
  .select('id, worker_id, status, message')
  .in('job_id', jobIds);

const workerIds = apps.map(a => a.worker_id);
const { data: profiles } = await supabase
  .from('worker_profiles')
  .select('user_id, full_name, whatsapp_number, trades, rating')
  .in('user_id', workerIds);

// ❌ Incorrecto — no hay FK directa entre job_applications y worker_profiles
.select('worker:worker_profiles(...)')
```

Para joins con datos de usuario (nombre, avatar) en reseñas, usar `users_public`:
```ts
.select('*, reviewer:users_public!reviewer_id(full_name)')
```

---

## Realtime habilitado

Las siguientes tablas tienen Supabase Realtime activo (publicación `supabase_realtime`):
- `job_posts` — trabajadores ven nuevos trabajos en tiempo real
- `job_applications` — clientes ven nuevas postulaciones, trabajadores ven cambios de estado
- `notifications` — badge de no leídas se actualiza en tiempo real

---

## Migraciones (orden de ejecución)

| Archivo | Contenido |
|---|---|
| `schema.sql` | Tablas base, índices, RLS inicial, triggers base |
| `001_production_ready.sql` | Columna `push_token`, fix RLS applications (trabajadores no se auto-aceptan), políticas explícitas de job_posts |
| `002_reviews_trigger.sql` | Trigger de rating con `SECURITY DEFINER` |
| `003_scalability.sql` | Índices compuestos, trigger auto-rechazar, trigger decrementar contador |
| `004_realtime.sql` | Habilitar Realtime en job_posts y job_applications |
| `005_notifications.sql` | Tabla notifications, RLS, Realtime |
