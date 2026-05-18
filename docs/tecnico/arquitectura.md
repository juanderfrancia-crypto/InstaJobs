# Arquitectura Técnica — InstaJobs

**Versión:** 2.0  
**Fecha:** Mayo 2026

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime móvil | Expo SDK | 54.0.34 |
| Framework | React Native | 0.81.5 |
| UI Library | React | 19.1.0 |
| Lenguaje | TypeScript | strict mode |
| Backend / DB | Supabase (PostgreSQL + Realtime + Storage + Edge Functions) | — |
| Auth | Supabase Phone Auth + Twilio | — |
| Notificaciones push | Expo Push Notifications | — |
| Iconografía | @expo/vector-icons (Ionicons) | ^15.1.1 |
| Navegación | React Navigation | native-stack + bottom-tabs |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Build / distribución | EAS Build (Expo Application Services) | — |

---

## Estructura de archivos

```
instajobs/
├── App.tsx                          # Entry point, NavigationContainer, AuthProvider, ErrorBoundary
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   ├── migrations/                  # 001–005, ejecutar en orden
│   └── functions/
│       └── send-notification/       # Edge Function — push via Expo Push Service
└── src/
    ├── constants/
    │   ├── index.ts                 # COLORS, SHADOW_*, CATEGORIES, URGENCY_OPTIONS
    │   └── colombiaMunicipios.ts    # 1.100+ municipios con departamento, búsqueda y utilidades
    ├── types/
    │   └── index.ts                 # Interfaces: User, WorkerProfile, JobPost, Review...
    ├── lib/
    │   ├── supabase.ts              # Cliente Supabase + AppState handler
    │   ├── notifications.ts         # sendPushNotification — guarda in-app + invoca Edge Function
    │   ├── storage.ts               # Subida de imágenes a Supabase Storage
    │   └── validation.ts            # Validaciones de formulario
    ├── services/                    # Toda la lógica de Supabase — las pantallas nunca importan supabase directamente
    │   ├── index.ts                 # Re-exporta todos los servicios
    │   ├── authService.ts
    │   ├── userService.ts
    │   ├── workerService.ts
    │   ├── jobService.ts
    │   ├── applicationService.ts
    │   ├── reviewService.ts
    │   └── notificationService.ts
    ├── hooks/
    │   ├── useAuth.tsx              # AuthContext — session, user, loading, isNewUser, signOut
    │   ├── useNetworkStatus.tsx     # Detecta conexión a internet (NetInfo)
    │   ├── useRealtimeChannel.ts    # Suscripción genérica a Supabase Realtime
    │   ├── useUnreadCount.ts        # Badge de notificaciones no leídas — actualización en tiempo real
    │   └── useNotifications.tsx     # Registro de push token con Expo Notifications
    ├── components/
    │   ├── UI.tsx                   # Button, Badge, Avatar, StarRating, Divider, SectionHeader
    │   ├── WorkerCard.tsx           # Tarjeta de trabajador (prop `compact` para feed vs detalle)
    │   ├── JobCard.tsx              # Tarjeta de trabajo (prop `compact`, `showApply`, `applied`)
    │   ├── SkeletonCard.tsx         # WorkerCardSkeleton, JobCardSkeleton, ChatRowSkeleton
    │   ├── MunicipioSearch.tsx      # Buscador de municipios con autocomplete
    │   └── NetworkStatus.tsx        # NoInternetScreen, LoadingScreen
    ├── navigation/
    │   └── MainTabs.tsx             # Bottom tab navigator (Home, Buscar, Publicar, Chats, Perfil)
    └── screens/
        ├── auth/                    # WelcomeScreen, PhoneScreen, OTPScreen, RoleScreen, OnboardingScreen
        ├── profile/                 # EditProfileScreen, MyActivityScreen, MyApplicationsScreen,
        │                            # MyRatingsScreen, HelpScreen, TermsScreen, ComingSoonScreen
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

## Navegación

```
RootNavigator (NativeStack, headerShown: false)
│
├── [Sin sesión]
│   ├── Welcome
│   ├── Phone
│   ├── OTP
│   ├── Role
│   └── Terms
│
├── [Con sesión + isNewUser]
│   ├── Role
│   └── Onboarding
│
└── [Autenticado]
    ├── Main → MainTabs (BottomTabs)
    │   ├── Home
    │   ├── Search
    │   ├── PostJob       ← botón circular elevado (solo clientes)
    │   ├── Chats
    │   └── Profile
    ├── WorkerProfile
    ├── JobDetail
    ├── ClientProfile
    ├── JobApplications
    ├── Review
    ├── PostJob
    ├── EditProfile
    ├── MyActivity
    ├── MyRatings
    ├── Help
    ├── Terms
    ├── ComingSoon
    ├── MyApplications
    └── Notifications
```

---

## Capa de servicios

Las pantallas nunca importan `supabase` directamente. Toda la lógica de BD va en `src/services/`:

```
pantalla → services/xyzService.ts → supabase
```

Esto permite:
- Testear servicios de forma aislada
- Cambiar queries en un solo lugar
- Mantener pantallas limpias de lógica de datos

---

## Patrón Safe Area (consistente en todas las pantallas)

```tsx
const insets = useSafeAreaInsets();

<View style={styles.container}>
  <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
  <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
    {/* contenido del header */}
  </View>
</View>

// No usar SafeAreaView de react-native — no da control visual del header
```

Pantallas con header azul → `barStyle="light-content"`.  
Pantallas con fondo claro → `barStyle="dark-content"`.

---

## Autenticación

El flujo de autenticación usa `AppState` para evitar que el usuario sea deslogueado al salir a revisar el SMS:

```ts
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

La navegación post-login usa `isNewUser` en el `AuthProvider` para evitar race conditions entre `onAuthStateChange` y `navigation.navigate()`:

- `isNewUser = true` → muestra Role → Onboarding
- `isNewUser = false` → muestra MainTabs directamente

---

## Sistema de notificaciones

Funciona en dos capas:

**1. In-app** — tabla `notifications` en Supabase. El hook `useUnreadCount` se suscribe a Realtime y actualiza el badge del ícono de campana en tiempo real.

**2. Push** — `sendPushNotification` en `src/lib/notifications.ts`:
1. Guarda la notificación en la tabla `notifications` (in-app)
2. Invoca la Edge Function `send-notification` de Supabase
3. La Edge Function busca el `push_token` del usuario y envía la notificación vía Expo Push Service

Los tokens push se registran con `useNotifications` hook durante el inicio de sesión.

---

## Constantes de estilo

```ts
// Paleta de colores principal
COLORS.primary       // #2563EB — azul primario (CTAs, links, iconos activos)
COLORS.primaryDark   // #1D4ED8 — azul oscuro
COLORS.primaryLight  // #EFF6FF — azul muy claro (fondos activos)
COLORS.accent        // #FF6B00 — naranja acento (badges, notificaciones, destacados)
COLORS.text          // #0F172A — azul oscuro/negro azulado (texto principal)
COLORS.background    // #F8FAFC — gris muy claro (fondo general)
COLORS.border        // #E2E8F0 — gris claro (bordes, divisores)

// Sombras — usar siempre estas constantes, nunca valores inline
SHADOW_SM      // elevation: 3  — elementos secundarios
SHADOW_MD      // elevation: 8  — cards principales
SHADOW_LG      // elevation: 14 — elementos flotantes
SHADOW_PRIMARY // elevation: 8, shadowColor azul — botones CTA primarios
SHADOW_HEADER  // elevation: 10, shadowColor azul — cabeceras de pantalla
```

---

## Convenciones

- **Sin emojis en código** — usar siempre `<Ionicons name="..." />` de @expo/vector-icons
- **Sin `SafeAreaView` de react-native** — usar `useSafeAreaInsets()` siempre
- **Sin imports de `supabase` en pantallas** — usar siempre los servicios de `src/services/`
- **Path alias `@/`** — apunta a `src/`. Configurado en `babel.config.js` con `babel-plugin-module-resolver`
- **TypeScript estricto** — todos los componentes con tipos explícitos
- **Skeleton en primera carga** — usar `isFirstLoad` ref para mostrar skeleton solo al inicio, no en refrescos
- **Notificaciones best-effort** — `sendPushNotification` está en try/catch y nunca bloquea el flujo principal
