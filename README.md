# InstaJobs

**Marketplace local de oficios y servicios** — Conecta trabajadores independientes con clientes en municipios y ciudades de Colombia. Nació en Cauca y Valle del Cauca con cobertura nacional.

---

## Inicio rápido

### Requisitos previos
- Node.js 18+
- npm
- Expo CLI: `npm install -g expo-cli`
- App **Expo Go** en tu celular (iOS o Android)

### 1. Instalar dependencias
```bash
cd instajobs
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecuta los archivos en este orden:
   ```
   supabase/schema.sql
   supabase/migrations/001_production_ready.sql
   supabase/migrations/002_reviews_trigger.sql
   supabase/migrations/003_scalability.sql
   supabase/migrations/004_realtime.sql
   supabase/migrations/005_notifications.sql
   ```
3. Crea la vista pública de usuarios (restringe phone y push_token):
   ```sql
   DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
   CREATE POLICY "Users see own full record" ON public.users
     FOR SELECT USING (auth.uid() = id);
   CREATE OR REPLACE VIEW public.users_public AS
     SELECT id, full_name, role, municipality, avatar_url,
            verified_phone, verified_id, created_at
     FROM public.users;
   GRANT SELECT ON public.users_public TO authenticated, anon;
   ```
4. Opcional: ejecuta `supabase/seed.sql` para datos de prueba
5. Copia tu **Project URL** y **anon key** desde Settings → API y pégalos en `app.json`:

```json
"extra": {
  "supabaseUrl": "https://TU_PROJECT.supabase.co",
  "supabaseAnonKey": "TU_ANON_KEY",
  "eas": { "projectId": "TU_EAS_PROJECT_ID" }
}
```

### 3. Configurar autenticación por SMS
En Supabase → Authentication → Providers → Phone:
- Habilita Phone Auth
- Configura Twilio con tu Account SID, Auth Token y número de origen
- En modo desarrollo puedes usar el OTP de prueba `123456`

### 4. Desplegar Edge Function
```bash
npx supabase functions deploy send-notification
```
Esta función recibe `to_user_id`, `title`, `body` y `data`, busca el `push_token` del usuario y envía la notificación vía Expo Push Service.

### 5. Correr la app
```bash
npm start
```
Escanea el QR con **Expo Go** desde tu celular.

---

## Estructura del proyecto

```
instajobs/
├── App.tsx                          # Entry point, navegación raíz, ErrorBoundary
├── app.json                         # Configuración Expo + variables de entorno
├── supabase/
│   ├── schema.sql                   # Tablas, índices, RLS base, triggers
│   ├── seed.sql                     # Datos de prueba
│   ├── migrations/
│   │   ├── 001_production_ready.sql # RLS corregido, columna push_token
│   │   ├── 002_reviews_trigger.sql  # Trigger recalcular rating
│   │   ├── 003_scalability.sql      # Índices compuestos, trigger auto-rechazar
│   │   ├── 004_realtime.sql         # Habilitar Realtime en tablas clave
│   │   └── 005_notifications.sql    # Tabla notifications + RLS + Realtime
│   └── functions/
│       └── send-notification/
│           └── index.ts             # Edge Function — push via Expo Push Service
└── src/
    ├── constants/
    │   ├── index.ts                 # Paleta de colores, sombras, categorías, opciones
    │   └── colombiaMunicipios.ts    # 1.100+ municipios con departamento, búsqueda, utilidades
    ├── types/
    │   └── index.ts                 # Interfaces TypeScript (WorkerProfile, JobPost, etc.)
    ├── lib/
    │   ├── supabase.ts              # Cliente Supabase singleton
    │   ├── notifications.ts         # storeNotification + invocar Edge Function
    │   ├── storage.ts               # Subida de imágenes a Supabase Storage
    │   └── validation.ts            # Validaciones de formulario
    ├── services/
    │   ├── index.ts                 # Re-exporta todos los servicios
    │   ├── authService.ts           # OTP, sesión, logout
    │   ├── userService.ts           # fetchUserById, updateUser, updatePushToken
    │   ├── workerService.ts         # fetchAvailableWorkers, upsertWorkerOnboarding, etc.
    │   ├── jobService.ts            # fetchOpenJobs, createJob, updateJobStatus, etc.
    │   ├── applicationService.ts    # apply, fetchApplications, updateStatus
    │   ├── reviewService.ts         # submitReview, fetchReviewsByTarget, fetchClientProfileData
    │   └── notificationService.ts   # fetchNotifications, fetchUnreadCount, markAllRead, storeNotification
    ├── hooks/
    │   ├── useAuth.tsx              # AuthContext — session, user, loading, isNewUser
    │   ├── useNetworkStatus.tsx     # Detecta conexión a internet
    │   ├── useRealtimeChannel.ts    # Suscripción genérica a Supabase Realtime
    │   ├── useUnreadCount.ts        # Badge de notificaciones no leídas en tiempo real
    │   └── useNotifications.tsx     # Registro de push token con Expo Notifications
    ├── components/
    │   ├── UI.tsx                   # Button, Badge, Avatar, StarRating, Divider, SectionHeader
    │   ├── WorkerCard.tsx           # Tarjeta de trabajador (feed y compacta)
    │   ├── JobCard.tsx              # Tarjeta de trabajo publicado (feed y compacta)
    │   ├── SkeletonCard.tsx         # WorkerCardSkeleton, JobCardSkeleton, ChatRowSkeleton
    │   ├── MunicipioSearch.tsx      # Buscador de municipios con autocomplete
    │   └── NetworkStatus.tsx        # NoInternetScreen, LoadingScreen
    ├── navigation/
    │   └── MainTabs.tsx             # Bottom tab navigator (Home, Buscar, Chats, Perfil)
    └── screens/
        ├── auth/
        │   ├── WelcomeScreen.tsx
        │   ├── PhoneScreen.tsx
        │   ├── OTPScreen.tsx
        │   ├── RoleScreen.tsx
        │   └── OnboardingScreen.tsx
        ├── profile/
        │   ├── EditProfileScreen.tsx
        │   ├── MyActivityScreen.tsx
        │   ├── MyApplicationsScreen.tsx
        │   ├── MyRatingsScreen.tsx
        │   ├── HelpScreen.tsx
        │   ├── TermsScreen.tsx
        │   └── ComingSoonScreen.tsx
        ├── HomeScreen.tsx
        ├── SearchScreen.tsx
        ├── ChatsScreen.tsx
        ├── ProfileScreen.tsx
        ├── NotificationsScreen.tsx
        ├── WorkerProfileScreen.tsx
        ├── ClientProfileScreen.tsx
        ├── JobDetailScreen.tsx
        ├── JobApplicationsScreen.tsx
        ├── PostJobScreen.tsx
        └── ReviewScreen.tsx
```

---

## Base de datos (Supabase)

| Tabla / Vista | Descripción |
|---|---|
| `users` | Todos los usuarios — id, phone, full_name, role, municipality, avatar_url, push_token |
| `users_public` | Vista sin phone ni push_token — lectura pública segura |
| `worker_profiles` | Perfil extendido del trabajador — trades, bio, whatsapp, rating, fotos |
| `job_posts` | Trabajos publicados por clientes |
| `job_applications` | Postulaciones de trabajadores a trabajos |
| `reviews` | Calificaciones y reseñas (inmutables una vez creadas) |
| `notifications` | Notificaciones in-app por usuario |

### Triggers automáticos
| Trigger | Evento | Efecto |
|---|---|---|
| `trg_update_worker_rating` | INSERT en `reviews` | Recalcula `rating` y `reviews_count` en `worker_profiles` |
| `on_application_insert` | INSERT en `job_applications` | Incrementa `applications_count` en `job_posts` |
| `trg_decrement_app_count` | DELETE en `job_applications` | Decrementa `applications_count` |
| `trg_auto_reject_others` | UPDATE en `job_applications` (aceptar) | Auto-rechaza las demás postulaciones del mismo trabajo |

### RLS destacado
- Trabajadores **no pueden** auto-aceptar su propia postulación — solo el cliente puede cambiar el estado
- Cada usuario solo lee sus propias notificaciones
- `phone` y `push_token` son privados — otros usuarios ven solo `users_public`

---

## Flujo de autenticación

```
WelcomeScreen → PhoneScreen → OTPScreen (Supabase SMS OTP via Twilio)
  ↓ nuevo usuario
RoleScreen → OnboardingScreen → HomeScreen
  ↓ usuario existente
HomeScreen  (automático via AuthProvider)
```

---

## Pantallas

| Pantalla | Rol | Descripción |
|---|---|---|
| Welcome | Todos | Presentación de la app |
| Phone + OTP | Todos | Login / registro con número colombiano |
| Role | Nuevo | Selección cliente / trabajador |
| Onboarding | Nuevo | Nombre, municipio, oficios, WhatsApp |
| Home | Todos | Feed según rol — trabajadores o trabajos disponibles en el municipio |
| Search | Todos | Búsqueda con filtros: texto, categoría, municipio o todo el departamento |
| WorkerProfile | Cliente | Perfil completo del trabajador — bio, oficios, reseñas, fotos, contacto WA |
| ClientProfile | Trabajador | Perfil del cliente — trabajos publicados, reseñas recibidas |
| JobDetail | Trabajador | Detalle del trabajo + formulario de postulación |
| JobApplications | Cliente | Postulaciones recibidas — aceptar o rechazar |
| PostJob | Cliente | Publicar una necesidad de trabajo |
| Review | Ambos | Dejar calificación y reseña al finalizar un trabajo |
| Chats | Ambos | Contactos con estado — acceso directo a WhatsApp para aceptados |
| Notifications | Todos | Centro de notificaciones in-app con badge en tiempo real |
| Profile | Todos | Perfil propio, disponibilidad (trabajadores), menú de ajustes |
| EditProfile | Todos | Editar nombre, municipio, foto, oficios, bio, WhatsApp |
| MyActivity | Ambos | Trabajos realizados (trabajador) / publicaciones (cliente) |
| MyApplications | Trabajador | Todas las postulaciones enviadas y su estado |
| MyRatings | Ambos | Reseñas recibidas |
| Help | Todos | Preguntas frecuentes |
| Terms | Todos | Términos de uso y política de privacidad |

---

## Sistema de notificaciones

Las notificaciones funcionan en dos capas:

1. **In-app** — se guardan en la tabla `notifications` y se muestran en `NotificationsScreen`. El badge del ícono de campana se actualiza en tiempo real vía Supabase Realtime.

2. **Push** — la función `sendPushNotification` en `src/lib/notifications.ts` guarda la notificación in-app y luego invoca la Edge Function `send-notification`, que busca el `push_token` del usuario y envía la notificación vía Expo Push Service.

Los tokens push se registran en el onboarding y se actualizan en cada inicio de sesión mediante `useNotifications`.

---

## Búsqueda por departamento

En `SearchScreen`, cuando el usuario selecciona un municipio aparece un toggle:

- **Solo [Municipio]** — filtra exactamente por ese municipio (`eq`)
- **Todo [Departamento]** — obtiene todos los municipios del departamento desde `colombiaMunicipios.ts` y filtra con `in()`

---

## Paleta de colores

| Variable | HEX | Uso |
|---|---|---|
| `primary` | `#2563EB` | Botones CTA, links, iconos activos |
| `primaryDark` | `#1D4ED8` | Hover, estados presionados |
| `primaryLight` | `#EFF6FF` | Fondos de elementos activos |
| `accent` | `#FF6B00` | Badges, notificaciones, destacados |
| `text` | `#0F172A` | Texto principal, títulos |
| `background` | `#F8FAFC` | Fondo general de la app |
| `border` | `#E2E8F0` | Bordes, divisores |

---

## Tech stack

| Capa | Tecnología |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Lenguaje | TypeScript |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) |
| Autenticación | Supabase Auth — OTP por SMS via Twilio |
| Notificaciones push | Expo Push Notifications (Expo Push Service) |
| Navegación | React Navigation v6 |
| Contacto entre usuarios | WhatsApp deep links (`wa.me/`) |
| Build / distribución | EAS Build (Expo Application Services) |

---

## Variables de entorno

Todas en `app.json > extra`:

```json
{
  "supabaseUrl": "https://xxx.supabase.co",
  "supabaseAnonKey": "eyJhb...",
  "eas": { "projectId": "tu-eas-project-id" }
}
```

Para producción usa `eas secret` para no exponer claves en el repositorio.

---

## Modelo de negocio

- **MVP (gratuito):** registro, búsqueda, contacto por WhatsApp, notificaciones
- **Fase 2:** membresía premium para trabajadores — mayor visibilidad en resultados
- **Fase 3:** publicaciones destacadas pagas

---

## Soporte

Para reportar bugs o sugerir mejoras, abre un issue en el repositorio.

**InstaJobs** · Hecho con amor para los trabajadores de Colombia
