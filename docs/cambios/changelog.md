# Changelog — InstaJobs

Historial de cambios ordenado de más reciente a más antiguo.

---

## [Unreleased] — Mayo 2026

### Agregado
- `docs/` — carpeta de documentación con resumen ejecutivo, arquitectura, BD y pantallas

### Cambiado
- **SearchScreen:** reescritura completa
  - Consciente del rol: trabajadores buscan `job_posts`, clientes buscan `worker_profiles`
  - Municipio opcional con chip "Todos" (antes era filtro obligatorio que devolvía vacío)
  - Todos los municipios visibles (antes solo 8)
  - Chip "Todos" también en categorías
  - Contador de resultados con municipio seleccionado
  - Estado inicial informativo en lugar de pantalla vacía

- **HomeScreen:** barra de búsqueda funcional
  - Reemplazado `TouchableOpacity` (redirigía a SearchScreen) por `TextInput` real
  - Filtrado inline en tiempo real sobre la lista cargada
  - Clientes: filtra por nombre del trabajador o categoría de oficio
  - Trabajadores: filtra por título o descripción del trabajo
  - Botón X para limpiar búsqueda
  - Empty state diferenciado: "sin resultados" vs "no hay en la zona"

---

## [0.9.0] — Mayo 2026

### Agregado
- **PostJobScreen:** reescritura completa con Ionicons
  - `cat.iconName` reemplaza `cat.icon` (que era undefined tras migración de emojis)
  - Patrón correcto safe area (`View` + `useSafeAreaInsets`)
  - Back button condicional según `navigation.canGoBack()`
  - Iconos en chips de municipio, urgencia y botón principal

- **ChatsScreen:** datos reales desde Supabase
  - Elimina `MOCK_CHATS` hardcodeados
  - Para clientes: query en dos pasos (job_posts → job_applications → worker_profiles)
  - Para trabajadores: join anidado `job:job_posts(client:users(...))`
  - Badge de estado por aplicación (Pendiente / Aceptado / Rechazado)
  - Pull-to-refresh, loading state, empty state con Ionicons

- **WorkerProfileScreen:** reescritura completa con Ionicons
  - Hero naranja con `useSafeAreaInsets` y back button integrado
  - Todos los emojis/texto con símbolos reemplazados por `<Ionicons />`
  - Indicador de disponibilidad con punto de color
  - Tabs con iconos (person-outline / star-outline)

- **JobDetailScreen:** reescritura completa con Ionicons
  - Header propio blanco con back button
  - Ícono de categoría usando `iconName` de CATEGORIES
  - Urgencia mapeada a Ionicons (flash, calendar-outline, time-outline)
  - Manejo explícito de error duplicado (código `23505`)
  - Banner de aplicación enviada con diseño mejorado

### Cambiado
- **App.tsx:** `headerShown: false` en WorkerProfile, JobDetail y PostJob
  — cada pantalla maneja su propio header y back button

---

## [0.8.0] — Mayo 2026

### Agregado
- **ProfileScreen:** reescritura con safe area y Ionicons
  - Toggle de disponibilidad con icono indicador
  - Menú con iconos en cada ítem
  - Banner Premium con estilo dorado

- **SearchScreen:** primera versión funcional
  - Filtros por categoría, municipio y texto
  - Query a Supabase con filtros encadenados
  - `WorkerCard` en resultados

- **HomeScreen:** primera versión funcional
  - Vista diferenciada cliente / trabajador
  - Categorías con scroll horizontal
  - Banner urgente para clientes
  - Integración con Supabase

---

## [0.7.0] — Mayo 2026

### Cambiado
- **Migración completa de emojis a Ionicons** en todos los componentes
  - `CATEGORIES`: `icon` (emoji) → `iconName` (string Ionicons) + `textColor`
  - `URGENCY_OPTIONS`: labels con emoji → `iconName`
  - `UI.tsx`: Button, Badge, StarRating actualizados
  - `WorkerCard`, `JobCard`: todos los iconos a Ionicons

- **Sombras:** constantes `SHADOW_SM`, `SHADOW_MD`, `SHADOW_LG` en `constants/index.ts`
  — usadas consistentemente en todos los componentes

---

## [0.6.0] — Mayo 2026

### Cambiado
- **Safe area consistente en todas las pantallas**
  - Patrón unificado: `View` root + `useSafeAreaInsets()` + `paddingTop: insets.top + 10`
  - Eliminado `SafeAreaView` de react-native en todas las pantallas
  - `StatusBar translucent` con `barStyle` según color del header
  - Headers naranjos cubren hasta la barra de notificaciones del sistema

---

## [0.5.0] — Mayo 2026

### Corregido
- **Race condition post-OTP:** navegación `NAVIGATE 'Role' not handled`
  - Causa: `onAuthStateChange` cambiaba el árbol de navegación antes de que `navigate('Role')` pudiera ejecutarse
  - Solución: estado `isNewUser` en `AuthProvider` — la navegación ocurre por renderizado condicional, no por imperativo

### Agregado
- **AppState handler en supabase.ts**
  - Pausa `autoRefresh` cuando la app va al background
  - Evita que el usuario sea deslogueado al salir a ver el SMS del OTP

---

## [0.4.0] — Mayo 2026

### Corregido
- **Schema cache error:** `could not find table public.users`
  - Causa: tablas no creadas en Supabase
  - Solución: ejecutar SQL completo con todas las tablas y políticas RLS

- **URL de Supabase incorrecta**
  - Causa: URL incluía sufijo `/rest/v1/`
  - Solución: usar solo `https://[project-id].supabase.co`

---

## [0.3.0] — Mayo 2026

### Corregido
- **PlatformConstants TurboModule error** en Expo Go
  - Causa: `react-native: 0.76.9` incompatible con Expo Go 54 (requiere RN 0.81.5)
  - Solución: actualizar a `react-native: 0.81.5` + `react: 19.1.0`

- **`Unable to resolve Fontisto.ttf`**
  - Causa: Metro no configurado para assets de fuentes
  - Solución: crear `metro.config.js` con `expo/metro-config`

---

## [0.2.0] — Mayo 2026

### Agregado
- Autenticación SMS/OTP con Twilio
  - Número canadiense (+1) para envío de SMS
  - Template de mensaje: `Tu código InstaJobs es {{ .Code }}`
- Flujo completo: WelcomeScreen → PhoneScreen → OTPScreen → RoleScreen → OnboardingScreen
- Schema de Supabase: tablas users, worker_profiles, job_posts, job_applications, reviews

---

## [0.1.0] — Mayo 2026

### Agregado
- Setup inicial del proyecto
  - Expo SDK 54.0.34, React Native 0.81.5, React 19.1.0
  - TypeScript con path alias `@/` → `src/`
  - `babel-plugin-module-resolver` para aliases
  - `react-native-safe-area-context`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
  - Supabase client configurado
