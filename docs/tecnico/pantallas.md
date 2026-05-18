# Inventario de Pantallas — InstaJobs

**Versión:** 2.0  
**Fecha:** Mayo 2026

---

## Flujo de autenticación

### WelcomeScreen
- Pantalla inicial con propuesta de valor
- Botón "Comenzar" → PhoneScreen

### PhoneScreen
- Input de número celular colombiano (+57)
- Llama a `supabase.auth.signInWithOtp({ phone })`
- Navega a OTPScreen

### OTPScreen
- 6 inputs individuales para el código SMS
- Auto-avance entre inputs, backspace retrocede al anterior
- Reenvío de código con countdown
- `supabase.auth.verifyOtp({ phone, token })` — el `AuthProvider` maneja la navegación post-verificación

### RoleScreen
- Selección visual de rol: Cliente o Trabajador
- Solo aparece si el usuario es nuevo (sin registro en `users`)
- Disponible también en el flujo de auth sin sesión (para que el usuario pueda leer términos)

### OnboardingScreen
- Formulario de perfil inicial según rol
- **Clientes:** nombre, municipio
- **Trabajadores:** nombre, municipio, WhatsApp, oficios (grid multi-selección), experiencia, bio
- Guarda en `users` y `worker_profiles` (si es trabajador)
- Registra el push token del dispositivo
- Llama `setIsNewUser(false)` → navega automáticamente a MainTabs

---

## Tabs principales

### HomeScreen
**Cliente:**
- Header azul con saludo (primer nombre + primer apellido) y municipio
- Botón de campana con badge de no leídas → NotificationsScreen
- Barra de búsqueda (decorativa) → SearchScreen
- Banner "¿Necesitas alguien hoy?" → PostJobScreen
- Filtros de categoría con scroll horizontal
- Lista de trabajadores disponibles en su municipio (premium primero)
- Realtime: se actualiza al llegar nuevos trabajadores
- Pull-to-refresh, skeleton en primera carga

**Trabajador:**
- Mismo layout pero muestra trabajos abiertos en su municipio
- Sin banner de publicar
- Botones "Aplicar" directos en las tarjetas de trabajo

### SearchScreen
**Ambos roles:**
- Estado inicial: grilla de 6 categorías rápidas (toca para buscar en un tap)
- Filtros: texto libre, categorías con chips, municipio con autocomplete
- Toggle de alcance (visible cuando hay municipio seleccionado):
  - **Solo [Municipio]** — filtra exactamente por ese municipio
  - **Todo [Departamento]** — filtra por todos los municipios del departamento
- Contador de resultados con número grande
- Paginación con botón "Ver N más"
- Scroll automático al inicio en nueva búsqueda
- Skeleton, empty state con "Limpiar filtros", error de red con retry

**Cliente:** busca en `worker_profiles` → WorkerProfileScreen  
**Trabajador:** busca en `job_posts` → JobDetailScreen

### PostJobScreen *(tab + stack)*
- Solo relevante para clientes
- Campos: categoría, título, descripción, municipio, urgencia, presupuesto (opcional)
- Validación de campos requeridos
- Back button condicional (`canGoBack()`)
- Post exitoso → navega a Home

### ChatsScreen
**Cliente:**
- Tarjetas por postulación recibida, ordenadas: aceptadas → pendientes → rechazadas
- Tarjeta: avatar, nombre trabajador, oficios, trabajo relacionado, estado con badge de color
- Solo aceptados tienen botón WhatsApp (verde con shadow)
- Empty state con CTA a PostJobScreen

**Trabajador:**
- Tarjetas por postulación enviada con info del cliente y el trabajo
- Solo aceptados tienen botón WhatsApp
- Empty state con CTA a HomeScreen

### ProfileScreen
- Tarjeta flotante con avatar, nombre, municipio, rol y badges de verificación
- Tarjeta de disponibilidad flotante (solo trabajadores)
- Banner Premium con CTA → ComingSoonScreen
- Menú agrupado en 3 secciones (iOS Settings style):
  - **Mi cuenta:** Editar perfil, Mis trabajos / publicaciones, Mis postulaciones (trabajadores), Mis calificaciones
  - **Configuración:** Verificar cédula, Plan Premium
  - **Soporte:** Ayuda, Términos y privacidad
- Botón "Cerrar sesión" con confirmación

---

## Pantallas de detalle (stack)

### WorkerProfileScreen
- Hero azul con back button y avatar centrado
- Nombre, municipio, años de experiencia, badges de verificación
- Stats: calificación con estrellas, número de trabajos, reseñas
- Indicador de disponibilidad en tiempo real
- Tabs: Información (bio + oficios con chips) | Reseñas (lista con avatar + rating)
- Footer fijo: botón "Contactar por WhatsApp" → deep link WhatsApp

### ClientProfileScreen
- Perfil del cliente visto por un trabajador
- Nombre, municipio, fecha de registro, badges
- Lista de trabajos activos del cliente (recientes)
- Estadísticas: total publicaciones, aceptación
- Reseñas recibidas del cliente

### JobDetailScreen
- Header blanco con back button
- Badge de categoría con ícono
- Título, municipio con ícono, fecha, badge de urgencia
- Descripción del trabajo
- Presupuesto (si aplica)
- Info del cliente (nombre, municipio)
- **Trabajadores:** formulario de postulación con mensaje (textarea)
  - Manejo de postulación duplicada (error code `23505`)
  - Banner de confirmación post-postulación
- **Clientes:** botón "Ver postulaciones" → JobApplicationsScreen

### JobApplicationsScreen
- Lista de trabajadores que aplicaron al trabajo
- Por cada postulación: avatar, nombre, oficios, mensaje, rating
- Botones Aceptar / Rechazar por postulación
- Al aceptar: auto-rechaza las demás (trigger en BD), envía notificación push al trabajador
- Estado visual actualizado en tiempo real

### ReviewScreen
- Formulario post-trabajo para calificar a la otra parte
- 5 estrellas interactivas
- Campo de comentario
- Solo accesible si el trabajo está en estado `completed`

### NotificationsScreen
- Centro de notificaciones in-app
- Lista ordenada por fecha (más reciente primero)
- Por cada notificación: ícono contextual con color, título, cuerpo, tiempo relativo
- Fondo azul claro para no leídas, punto de color a la izquierda
- Toca notificación → navega a la pantalla correspondiente (JobApplications, MyApplications)
- Al abrir la pantalla: marca todas como leídas automáticamente
- Pull-to-refresh, skeleton en carga

---

## Pantallas de perfil (stack desde ProfileScreen)

### EditProfileScreen
- Editar nombre, municipio, foto de perfil (subida a Supabase Storage)
- **Trabajadores:** adicionalmente editan WhatsApp, oficios, bio, años de experiencia, fotos portafolio
- Guarda en `users` y `worker_profiles`

### MyActivityScreen
- **Trabajador:** historial de trabajos realizados con estado
- **Cliente:** publicaciones propias con estado y conteo de postulaciones

### MyApplicationsScreen *(solo trabajadores)*
- Todas las postulaciones enviadas
- Estado visual por postulación: Pendiente / Aceptado / Rechazado
- Toca → JobDetailScreen del trabajo correspondiente

### MyRatingsScreen
- Reseñas recibidas por el usuario
- Promedio de calificación con estrellas
- Lista cronológica de reseñas con nombre del reviewer

### HelpScreen
- Preguntas frecuentes agrupadas por tema
- Expandible por sección

### TermsScreen
- Términos de uso y política de privacidad
- 9 secciones: descripción del servicio, cuentas, responsabilidades, pagos, datos personales, comunicaciones, prohibiciones, modificaciones, jurisdicción

### ComingSoonScreen
- Pantalla genérica para funcionalidades en desarrollo (ej: verificación de cédula, Premium)
- Muestra la funcionalidad que viene y botón de volver

---

## Patrones de UX consistentes

Todas las pantallas con datos remotos implementan:
- **Skeleton en primera carga** — animación de shimmer con `Animated.loop`
- **Pull-to-refresh** — `RefreshControl` con `tintColor={COLORS.primary}`
- **Empty state** — ícono + título + subtexto + CTA cuando aplica
- **Error de red** — ícono de nube offline + botón "Reintentar"
- **Safe area** — `useSafeAreaInsets()` con `paddingTop: insets.top + 10` en el header
