# InstaJobs 🔨

**Marketplace local de oficios y servicios** — Conecta trabajadores independientes con clientes en municipios, veredas y pequeñas ciudades de Colombia.

---

## 🚀 Inicio rápido

### 1. Requisitos previos
- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- App **Expo Go** en tu celular (iOS o Android)

### 2. Instalar dependencias
```bash
cd instajobs
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecuta `supabase/schema.sql`
3. Opcional: ejecuta `supabase/seed.sql` para datos de prueba
4. Copia tu **Project URL** y **anon key** desde Settings → API
5. Pégalos en `app.json`:

```json
"extra": {
  "supabaseUrl": "https://TU_PROJECT.supabase.co",
  "supabaseAnonKey": "TU_ANON_KEY"
}
```

### 4. Configurar autenticación por SMS
En Supabase → Authentication → Providers → Phone:
- Habilita Phone Auth
- Configura Twilio (recomendado) o usa el modo de desarrollo (OTP = `123456`)

### 5. Correr la app
```bash
npm start
```
Escanea el QR con **Expo Go** desde tu celular.

---

## 📁 Estructura del proyecto

```
instajobs/
├── App.tsx                    # Entry point, navegación raíz
├── app.json                   # Configuración Expo
├── supabase/
│   ├── schema.sql             # Tablas, índices, RLS, triggers
│   └── seed.sql               # Datos de prueba
└── src/
    ├── constants/
    │   └── index.ts           # Colores, categorías, municipios
    ├── types/
    │   └── index.ts           # TypeScript interfaces
    ├── lib/
    │   └── supabase.ts        # Cliente Supabase
    ├── hooks/
    │   └── useAuth.tsx        # Context de autenticación
    ├── components/
    │   ├── UI.tsx             # Button, Badge, Avatar, StarRating...
    │   ├── WorkerCard.tsx     # Tarjeta de trabajador
    │   └── JobCard.tsx        # Tarjeta de trabajo publicado
    ├── navigation/
    │   └── MainTabs.tsx       # Bottom tab navigator
    └── screens/
        ├── auth/
        │   ├── WelcomeScreen.tsx
        │   ├── PhoneScreen.tsx
        │   ├── OTPScreen.tsx
        │   ├── RoleScreen.tsx
        │   └── OnboardingScreen.tsx
        ├── HomeScreen.tsx
        ├── SearchScreen.tsx
        ├── PostJobScreen.tsx
        ├── WorkerProfileScreen.tsx
        ├── JobDetailScreen.tsx
        ├── ChatsScreen.tsx
        └── ProfileScreen.tsx
```

---

## 🗄️ Base de datos (Supabase)

| Tabla | Descripción |
|---|---|
| `users` | Todos los usuarios (clientes y trabajadores) |
| `worker_profiles` | Perfil extendido de cada trabajador |
| `job_posts` | Trabajos publicados por clientes |
| `job_applications` | Aplicaciones de trabajadores a trabajos |
| `reviews` | Calificaciones y reseñas |

**Triggers automáticos:**
- Al insertar una reseña → actualiza `rating` y `reviews_count` en `worker_profiles`
- Al insertar una aplicación → incrementa `applications_count` en `job_posts`

---

## 🔑 Flujo de autenticación

```
WelcomeScreen → PhoneScreen → OTPScreen (Supabase SMS OTP)
  ↓ nuevo usuario
RoleScreen → OnboardingScreen → HomeScreen
  ↓ usuario existente
HomeScreen (automático via AuthProvider)
```

---

## 💡 Variables de entorno

Todas en `app.json > extra`:

```json
{
  "supabaseUrl": "https://xxx.supabase.co",
  "supabaseAnonKey": "eyJhb..."
}
```

Para producción usa `eas secret` o variables de entorno de EAS Build.

---

## 📱 Pantallas del MVP

| Pantalla | Descripción |
|---|---|
| Welcome | Presentación de la app |
| Phone + OTP | Login/registro con celular |
| Role | Selección cliente / trabajador |
| Onboarding | Nombre, municipio, oficios (trabajador) |
| Home | Feed principal — trabajadores o trabajos según rol |
| Search | Búsqueda con filtros de categoría y municipio |
| WorkerProfile | Perfil completo con reseñas y fotos |
| JobDetail | Detalle de trabajo + formulario de aplicación |
| PostJob | Publicar nueva necesidad de trabajo |
| Chats | Historial de contactos vía WhatsApp |
| Profile | Perfil propio, disponibilidad, ajustes |

---

## 💰 Modelo de negocio (roadmap)

- **MVP (gratis):** registro, búsqueda, contacto por WhatsApp
- **Fase 2:** membresía premium trabajadores ($29.900 COP/mes)
- **Fase 3:** publicaciones destacadas pagas, pagos in-app con Wompi

---

## 🛠️ Tech stack

- **Frontend:** React Native + Expo SDK 50
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Autenticación:** Supabase Auth (OTP por SMS)
- **Navegación:** React Navigation v6
- **Contacto:** WhatsApp deep links (`wa.me/`)
- **Notificaciones:** Firebase Cloud Messaging (Fase 2)
- **Pagos:** Wompi Colombia (Fase 3)

---

## 📞 Soporte

Para reportar bugs o sugerir mejoras, abre un issue en el repositorio.

**InstaJobs** · Hecho con ❤️ para el Oriente Antioqueño 🇨🇴
