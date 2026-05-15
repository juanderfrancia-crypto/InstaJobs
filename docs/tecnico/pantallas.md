# Inventario de Pantallas — InstaJobs

**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Flujo de autenticación

### WelcomeScreen
- Pantalla inicial con propuesta de valor
- Botones: "Soy cliente" y "Soy trabajador" → PhoneScreen con `role` como parámetro

### PhoneScreen
- Input de número celular colombiano (+57)
- Llama a `supabase.auth.signInWithOtp({ phone })`
- Navega a OTPScreen

### OTPScreen
- 6 inputs individuales para el código SMS
- Auto-avance entre inputs y backspace entre inputs
- Reenvío de código con countdown
- `supabase.auth.verifyOtp({ phone, token })` — el `AuthProvider` maneja la navegación post-verificación

### RoleScreen
- Selección visual de rol: Cliente o Trabajador
- Solo aparece si el usuario es nuevo (sin registro en `users`)

### OnboardingScreen
- Formulario de perfil inicial según rol
- **Clientes:** nombre, municipio
- **Trabajadores:** nombre, municipio, WhatsApp, oficios (grid multi-selección), experiencia, bio
- Guarda en `users` y `worker_profiles` (si es trabajador)
- Llama `setIsNewUser(false)` → navega automáticamente a MainTabs

---

## Tabs principales

### HomeScreen
**Cliente:**
- Header naranja con nombre del municipio y botón de notificaciones
- Barra de búsqueda inline (filtra la lista cargada en tiempo real)
- Banner "¿Necesitas alguien hoy?" → PostJobScreen
- Filtros de categoría horizontal
- Lista de trabajadores disponibles en su municipio (ordenados por Premium primero)
- Pull-to-refresh

**Trabajador:**
- Mismo layout pero muestra trabajos abiertos en su municipio
- Sin banner de publicar

### SearchScreen
**Cliente:**
- Busca en `worker_profiles` con filtros: texto (nombre), categoría, municipio
- Municipio "Todos" disponible para buscar en toda la región
- Muestra `WorkerCard` → navega a WorkerProfileScreen

**Trabajador:**
- Busca en `job_posts` (status='open') con filtros: texto (título), categoría, municipio
- Muestra `JobCard` → navega a JobDetailScreen

### PostJobScreen (tab + stack)
- Solo relevante para clientes
- Campos: categoría, título, descripción, municipio, urgencia, presupuesto (opcional)
- Back button condicional (solo cuando viene del stack, no del tab)
- Post exitoso → navega a Home

### ChatsScreen
**Cliente:**
- Lista trabajadores que aplicaron a sus publicaciones
- Muestra: nombre, oficios, trabajo relacionado, estado de aplicación (Pendiente/Aceptado/Rechazado)
- Toca para abrir WhatsApp con el trabajador

**Trabajador:**
- Lista trabajos a los que aplicó con info del cliente
- Toca para abrir WhatsApp con el cliente

### ProfileScreen
- Foto/avatar con iniciales, nombre, municipio
- Badges de verificación (celular, cédula)
- Toggle de disponibilidad (solo trabajadores) — actualiza `worker_profiles.available`
- Banner Premium
- Menú: Editar perfil, Mis trabajos, Calificaciones, Notificaciones, Verificar cédula, Premium, Ayuda, Términos
- Botón cerrar sesión con confirmación

---

## Pantallas de detalle (stack)

### WorkerProfileScreen
- Hero naranja con back button
- Avatar, nombre, oficios, años de experiencia
- Stats: calificación, trabajos, reseñas
- Badges de verificación y municipio
- Indicador de disponibilidad en tiempo real
- Tabs: Información (bio + servicios) | Reseñas
- Footer fijo: botón "Contactar por WhatsApp" → deep link WhatsApp

### JobDetailScreen
- Header blanco con back button
- Ícono de categoría con color
- Título, municipio, fecha, badge de urgencia
- Descripción del trabajo
- Presupuesto (si aplica)
- Formulario de aplicación con mensaje (solo trabajadores)
- Manejo de aplicación duplicada (error code `23505`)
- Banner de confirmación post-aplicación

---

## Estados de carga y vacío

Todas las pantallas con datos remotos implementan:
- **Loading:** `ActivityIndicator` centrado
- **Empty state:** ícono + título + subtexto explicativo
- **Pull-to-refresh:** `RefreshControl` con `tintColor={COLORS.primary}`
- **Error:** `Alert.alert` con mensaje del error de Supabase
