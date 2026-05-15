# Base de Datos — InstaJobs (Supabase / PostgreSQL)

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Proyecto Supabase:** `wvfffctnamjdvddrhshv`

---

## Tablas

### `users`
Extiende `auth.users` de Supabase. Se crea en el onboarding.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Mismo ID de `auth.users` |
| `phone` | text | Número con código país (+57XXXXXXXXXX) |
| `full_name` | text | Nombre completo |
| `role` | text | `'client'` o `'worker'` |
| `municipality` | text | Municipio del usuario |
| `verified_phone` | boolean | Siempre `true` tras OTP exitoso |
| `verified_id` | boolean | Verificación de cédula (default `false`) |
| `created_at` | timestamptz | Auto |

---

### `worker_profiles`
Perfil extendido del trabajador. Solo existe si `role = 'worker'`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id) | |
| `full_name` | text | Duplicado de users para queries rápidas |
| `municipality` | text | Duplicado para filtros geográficos |
| `trades` | text[] | Array de IDs de categorías |
| `bio` | text | Descripción del trabajador |
| `experience_years` | integer | Años de experiencia |
| `whatsapp_number` | text | Número sin código país |
| `available` | boolean | Toggle de disponibilidad |
| `membership_tier` | text | `'free'` o `'premium'` |
| `photos` | text[] | URLs de fotos del portafolio |
| `rating` | numeric | Promedio de calificaciones |
| `reviews_count` | integer | Total de reseñas |
| `jobs_completed` | integer | Total de trabajos completados |

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
| `budget_min` | integer | Presupuesto mínimo (COP), nullable |
| `budget_max` | integer | Presupuesto máximo (COP), nullable |
| `status` | text | `'open'`, `'in_progress'`, `'completed'`, `'cancelled'` |
| `photos` | text[] | URLs de fotos del trabajo |
| `created_at` | timestamptz | Auto |

---

### `job_applications`
Aplicaciones de trabajadores a publicaciones. Constraint único: `(job_id, worker_id)`.

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
Calificaciones y reseñas post-trabajo.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | |
| `job_id` | UUID (FK → job_posts.id) | |
| `reviewer_id` | UUID (FK → users.id) | Quien califica |
| `reviewed_id` | UUID (FK → users.id) | Quien es calificado |
| `rating` | integer | 1 a 5 estrellas |
| `comment` | text | Comentario de la reseña |
| `created_at` | timestamptz | Auto |

---

## Relaciones clave

```
auth.users
    └── users (1:1)
            ├── worker_profiles (1:1, solo si role='worker')
            ├── job_posts (1:N, solo si role='client')
            ├── job_applications (1:N, solo si role='worker')
            └── reviews (1:N como reviewer o reviewed)

job_posts
    └── job_applications (1:N)
```

---

## Nota importante sobre joins en Supabase

`job_applications.worker_id` tiene FK a `users.id`, **no** a `worker_profiles.user_id`.

Para obtener datos de `worker_profiles` desde `job_applications` se requiere una query en dos pasos:

```ts
// ✅ Correcto — dos queries separadas
const { data: apps } = await supabase
  .from('job_applications')
  .select('id, worker_id, ...')
  .in('job_id', jobIds);

const workerIds = apps.map(a => a.worker_id);
const { data: profiles } = await supabase
  .from('worker_profiles')
  .select('user_id, full_name, whatsapp_number')
  .in('user_id', workerIds);

// ❌ Incorrecto — el join automático no funciona por la cadena de FK
.select('worker:worker_profiles(...)')  // no hay FK directa
```

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas básicas:

| Tabla | Lectura | Escritura |
|---|---|---|
| `users` | Propio registro | Solo el propio usuario |
| `worker_profiles` | Público (para búsquedas) | Solo el propio trabajador |
| `job_posts` | Público (status='open') | Solo el cliente dueño |
| `job_applications` | Trabajador propio + cliente del job | Solo el trabajador aplicante |
| `reviews` | Público | Solo el reviewer del job |
