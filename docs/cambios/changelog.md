# Changelog — InstaJobs

Historial de cambios ordenado de más reciente a más antiguo.

---

## [Unreleased] — Mayo 2026

### Agregado
- **Búsqueda por departamento** en SearchScreen
  - Toggle "Solo [Municipio]" / "Todo [Departamento]" visible al seleccionar municipio
  - Utilidades `getDepartamentoByMunicipio` y `getMunicipiosEnDepartamento` en `colombiaMunicipios.ts`
  - Servicios `fetchOpenJobs` y `fetchAvailableWorkers` aceptan `municipalities?: string[]` para filtrar con `.in()`

- **Documentación actualizada** — todos los docs en `docs/` reflejan el estado actual del MVP

### Corregido
- **Avatar roto en Android** — `SHADOW_SM` (elevation: 3) en el View interior del Avatar causaba que las fotos no se renderizaran en Android. Eliminado el shadow del Avatar.
- **Skeleton en bucle en HomeScreen** — `useUnreadCount` sin try/catch causaba posibles fallos silenciosos que afectaban el canal Realtime. Agregado manejo de errores.
- **RLS `users`** — `phone` y `push_token` eran visibles para todos los usuarios autenticados. Creada vista `users_public` sin campos sensibles y actualizada la política SELECT.
- **Queries rotas post-RLS** — `reviewService.ts` usaba `from('users')` para leer datos de otros usuarios. Migradas a `from('users_public')` y joins actualizados.

---

## [1.3.0] — Mayo 2026

### Agregado
- **Sistema de notificaciones completo**
  - Tabla `notifications` en Supabase con RLS y Realtime (`005_notifications.sql`)
  - `notificationService.ts` — fetchNotifications, fetchUnreadCount, markAllRead, storeNotification
  - `useUnreadCount` hook — badge en tiempo real vía Supabase Realtime
  - `useNotifications` hook — registro de push token con Expo Notifications
  - `NotificationsScreen` — lista con skeleton, iconos contextuales, fondo azul para no leídas, auto-marcar al abrir
  - `src/lib/notifications.ts` — `sendPushNotification` guarda in-app + invoca Edge Function
  - Edge Function `send-notification` — busca push_token y envía via Expo Push Service
  - Bell button en HomeScreen con badge de no leídas
  - `NotificationsScreen` registrada en el navegador principal

---

## [1.2.0] — Mayo 2026

### Cambiado
- **Paleta de colores** — migración de naranja a azul primario
  - `primary`: `#F97316` → `#2563EB` (Azul Primario)
  - `primaryDark`: `#EA580C` → `#1D4ED8`
  - `primaryLight`: `#FFF7ED` → `#EFF6FF`
  - `text`: `#1C1C1A` → `#0F172A` (Azul Oscuro / Negro Azulado)
  - `background`: `#F5F5F3` → `#F8FAFC` (Gris Muy Claro)
  - `border`: `#E8E8E4` → `#E2E8F0` (Gris Claro)
  - Agregado `accent: '#FF6B00'` (Naranja Acento — badges, notificaciones, destacados)
  - Sombras actualizadas: `shadowColor` de naranja a azul

---

## [1.1.0] — Mayo 2026

### Agregado
- **ProfileScreen** reescritura completa
  - Tarjeta flotante con avatar, nombre, rol y badges
  - Tarjeta de disponibilidad flotante (trabajadores)
  - Menú agrupado en 3 secciones con iconos de color (estilo iOS Settings)
  - Banner Premium
  - Cerrar sesión con confirmación

- **ChatsScreen** reescritura completa
  - Tarjetas por contacto (antes era lista plana)
  - Ordenamiento por estado: aceptados → pendientes → rechazados
  - Botón WhatsApp exclusivo para contactos aceptados
  - Skeleton con `ChatRowSkeleton`
  - Empty states diferenciados con CTA según rol

- **SearchScreen** segunda reescritura
  - Grilla de 6 categorías rápidas como estado inicial
  - Skeleton en carga
  - `overrideCategory` para búsqueda instantánea desde categorías rápidas
  - `scrollRef` para scroll automático al inicio en cada búsqueda
  - Contador grande con número de resultados

### Cambiado
- **Sistema de sombras rediseñado**
  - `SHADOW_SM/MD/LG` con valores corregidos y `shadowColor` oscuro
  - Agregado `SHADOW_PRIMARY` — shadow coloreado para botones CTA
  - Agregado `SHADOW_HEADER` — shadow para headers de pantalla

---

## [1.0.0] — Mayo 2026

### Agregado
- **HomeScreen** — saludo con primer nombre y primer apellido
  - "Carlos Andres Mina Vasquez" → muestra "Carlos Mina"
  - Regla: palabra[0] + palabra[2] si hay 3+ palabras, ambas si hay 2

- **JobApplicationsScreen** — gestión de postulaciones para clientes
  - Aceptar / rechazar por postulación
  - Notificación push automática al aceptar/rechazar

- **ReviewScreen** — calificación post-trabajo
  - 5 estrellas interactivas
  - Trigger en BD actualiza rating del trabajador automáticamente

- **ClientProfileScreen** — perfil del cliente visto por trabajadores

- **Pantallas de perfil:**
  - EditProfileScreen con subida de fotos
  - MyActivityScreen
  - MyApplicationsScreen
  - MyRatingsScreen
  - HelpScreen
  - TermsScreen (9 secciones, jurisdicción Colombia)
  - ComingSoonScreen

- **NetworkStatus** — `NoInternetScreen` y `LoadingScreen`
- **useNetworkStatus** hook
- **useRealtimeChannel** hook genérico para suscripciones Realtime
- **SkeletonCard** — shimmer animado para WorkerCard, JobCard y ChatRow

---

## [0.9.0] — Mayo 2026

### Agregado
- **PostJobScreen** reescritura completa con Ionicons
- **ChatsScreen** — datos reales desde Supabase (eliminados mocks)
- **WorkerProfileScreen** — reescritura con hero, tabs y stats
- **JobDetailScreen** — reescritura con formulario de postulación y manejo de duplicados

---

## [0.8.0] — Mayo 2026

### Agregado
- **ProfileScreen** primera versión funcional
- **SearchScreen** primera versión funcional
- **HomeScreen** primera versión funcional con integración Supabase

---

## [0.7.0] — Mayo 2026

### Cambiado
- **Migración completa de emojis a Ionicons**
  - `CATEGORIES`: `icon` (emoji) → `iconName` (string Ionicons) + `color` + `textColor`
  - `URGENCY_OPTIONS`: `iconName` en lugar de emojis
  - Todos los componentes y pantallas actualizados

---

## [0.6.0] — Mayo 2026

### Cambiado
- **Safe area consistente** en todas las pantallas
  - Patrón unificado: `useSafeAreaInsets()` + `paddingTop: insets.top + 10`
  - Eliminado `SafeAreaView` de react-native
  - `StatusBar translucent` con `barStyle` según color del header

---

## [0.5.0] — Mayo 2026

### Corregido
- **Race condition post-OTP** — `NAVIGATE 'Role' not handled`
  - Causa: `onAuthStateChange` cambiaba el árbol de navegación antes de que `navigate('Role')` pudiera ejecutarse
  - Solución: estado `isNewUser` en `AuthProvider` — navegación por renderizado condicional, no imperativa

### Agregado
- **AppState handler en supabase.ts** — pausa `autoRefresh` en background para evitar logout al revisar SMS

---

## [0.4.0] — Mayo 2026

### Corregido
- **Schema cache error:** `could not find table public.users`
- **URL de Supabase incorrecta** — no debe incluir `/rest/v1/`

---

## [0.3.0] — Mayo 2026

### Corregido
- **PlatformConstants TurboModule error** — actualizado `react-native: 0.76.9` → `0.81.5`
- **`Unable to resolve Fontisto.ttf`** — creado `metro.config.js` con `expo/metro-config`

---

## [0.2.0] — Mayo 2026

### Agregado
- Autenticación SMS/OTP con Twilio
- Flujo completo: Welcome → Phone → OTP → Role → Onboarding
- Schema Supabase: users, worker_profiles, job_posts, job_applications, reviews

---

## [0.1.0] — Mayo 2026

### Agregado
- Setup inicial: Expo SDK 54, React Native 0.81.5, React 19.1.0, TypeScript
- Path alias `@/` → `src/`
- Supabase client configurado
