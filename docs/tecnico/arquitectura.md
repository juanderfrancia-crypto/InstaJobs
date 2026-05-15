# Arquitectura Técnica — InstaJobs

**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime móvil | Expo SDK | 54.0.34 |
| Framework | React Native | 0.81.5 |
| UI Library | React | 19.1.0 |
| Lenguaje | TypeScript | strict mode |
| Backend / DB | Supabase (PostgreSQL) | — |
| Auth | Supabase Phone Auth + Twilio | — |
| Iconografía | @expo/vector-icons (Ionicons) | ^15.1.1 |
| Navegación | React Navigation | native-stack + bottom-tabs |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Storage local | @react-native-async-storage | 2.2.0 |

---

## Estructura de archivos

```
instajobs/
├── App.tsx                        # Entry point, NavigationContainer, AuthProvider
├── src/
│   ├── constants/index.ts         # COLORS, SHADOW_SM/MD/LG, CATEGORIES, MUNICIPALITIES
│   ├── types/index.ts             # Interfaces TypeScript (User, WorkerProfile, JobPost…)
│   ├── lib/
│   │   └── supabase.ts            # Cliente Supabase + AppState handler
│   ├── hooks/
│   │   └── useAuth.tsx            # AuthProvider, sesión, isNewUser, signOut
│   ├── navigation/
│   │   └── MainTabs.tsx           # Bottom tab navigator personalizado
│   ├── components/
│   │   ├── UI.tsx                 # Button, Badge, StarRating, Avatar, Divider
│   │   ├── WorkerCard.tsx         # Tarjeta de trabajador para listas
│   │   └── JobCard.tsx            # Tarjeta de trabajo para listas
│   └── screens/
│       ├── auth/
│       │   ├── WelcomeScreen.tsx
│       │   ├── PhoneScreen.tsx
│       │   ├── OTPScreen.tsx
│       │   ├── RoleScreen.tsx
│       │   └── OnboardingScreen.tsx
│       ├── HomeScreen.tsx
│       ├── SearchScreen.tsx
│       ├── PostJobScreen.tsx
│       ├── ChatsScreen.tsx
│       ├── ProfileScreen.tsx
│       ├── WorkerProfileScreen.tsx
│       └── JobDetailScreen.tsx
└── docs/                          # Esta carpeta
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
│   └── Onboarding
│
├── [Con sesión + isNewUser]
│   ├── Role
│   └── Onboarding
│
└── [Autenticado]
    ├── Main → MainTabs (BottomTabs)
    │   ├── Home
    │   ├── Search
    │   ├── Post          ← botón circular elevado
    │   ├── Chats
    │   └── Profile
    ├── WorkerProfile     ← headerShown: false (header propio)
    ├── JobDetail         ← headerShown: false (header propio)
    └── PostJob           ← headerShown: false (header propio)
```

---

## Patrón Safe Area (consistente en todas las pantallas)

```tsx
// ✅ Patrón correcto — todas las pantallas de la app usan esto
const insets = useSafeAreaInsets();

<View style={styles.container}>
  <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
  <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
    {/* contenido del header */}
  </View>
  {/* resto de la pantalla */}
</View>

// ❌ No usar SafeAreaView de react-native — no da control visual del header
```

**Regla:** Pantallas con header naranja usan `barStyle="light-content"`. Pantallas con header blanco (JobDetail) usan `barStyle="dark-content"`.

---

## Autenticación

El flujo de autenticación usa `AppState` para evitar que el usuario sea deslogueado al salir a revisar el SMS:

```ts
// lib/supabase.ts
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

La navegación post-login usa `isNewUser` en el `AuthProvider` para evitar race conditions entre `onAuthStateChange` y `navigation.navigate()`:

- `isNewUser = true` → muestra Role → Onboarding
- `isNewUser = false` → muestra MainTabs directamente

---

## Constantes de estilo

```ts
// Sombras — usar siempre estas constantes, nunca valores inline
SHADOW_SM  // elevation: 2  — cards secundarias
SHADOW_MD  // elevation: 4  — cards principales
SHADOW_LG  // elevation: 7  — elementos flotantes (tab bar, botones CTA)

// Colores primarios
COLORS.primary      // #F97316 — naranja principal
COLORS.primaryDark  // #EA580C — naranja oscuro (texto activo)
COLORS.primaryLight // #FFF7ED — naranja muy claro (fondos activos)
COLORS.whatsapp     // #25D366 — verde WhatsApp
```

---

## Convenciones

- **Sin emojis en código** — usar siempre `<Ionicons name="..." />` de @expo/vector-icons
- **Sin `SafeAreaView` de react-native** — usar `useSafeAreaInsets()` siempre
- **Path alias `@/`** — apunta a `src/`. Configurado en `babel.config.js` con `babel-plugin-module-resolver`
- **TypeScript estricto** — todos los componentes con tipos explícitos
