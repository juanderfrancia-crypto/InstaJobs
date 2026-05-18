# Resumen Ejecutivo — InstaJobs

**Versión:** 2.0  
**Fecha:** Mayo 2026  
**Estado:** MVP completo — listo para beta con usuarios reales

---

## ¿Qué es InstaJobs?

InstaJobs es un marketplace móvil que conecta trabajadores independientes de oficios con clientes en municipios y ciudades de Colombia. Nació en Cauca y Valle del Cauca con vocación de cobertura nacional.

El problema que resuelve: en zonas rurales y pequeñas ciudades no existe una plataforma local que conecte la oferta y demanda de servicios del hogar (plomería, electricidad, construcción, etc.). Los clientes consiguen trabajadores por voz a voz, y los trabajadores dependen de referidos para conseguir trabajo.

---

## Mercado objetivo

**Geografía inicial:** Cauca y Valle del Cauca  
**Cobertura:** Nacional — todos los municipios de Colombia están disponibles en el listado  

**Usuario cliente:** Propietario de vivienda o negocio que necesita contratar servicios del hogar o construcción.

**Usuario trabajador:** Plomero, electricista, albañil, pintor, jardinero, carpintero u otro trabajador independiente que busca más clientes.

---

## Propuesta de valor

| Para clientes | Para trabajadores |
|---|---|
| Encuentra trabajadores verificados en su municipio | Recibe más clientes sin depender del voz a voz |
| Publica trabajos urgentes en 30 segundos | Perfil profesional con calificaciones y reseñas |
| Contacto directo por WhatsApp | Control de disponibilidad en tiempo real |
| Ve calificaciones y reseñas antes de contratar | Membresía Premium para aparecer primero |

---

## Categorías de oficios

Plomería · Electricidad · Construcción · Pintura · Jardinería · Techos · Albañilería · Puertas y Ventanas · Repello · Ayudante día · Carpintería · Soldadura · Aseo del hogar · Electrodomésticos · Cerrajería · Fumigación · Mudanzas/Fletes · Mecánica · Cuidado de personas · Tecnología/Sistemas

---

## Estado actual del MVP (Mayo 2026)

### Completado ✅
- Autenticación por SMS/OTP (Twilio + Supabase Phone Auth)
- Onboarding diferenciado por rol (cliente / trabajador)
- Home con feed dinámico según rol, filtros por categoría y saludo personalizado
- Búsqueda avanzada por texto, categoría, municipio o todo el departamento
- Publicación de trabajos con urgencia y presupuesto
- Perfil completo del trabajador con stats, reseñas, fotos y contacto WhatsApp
- Detalle del trabajo con formulario de postulación
- Gestión de postulaciones — clientes aceptan/rechazan, trabajadores cancelan
- Calificación y reseña post-trabajo (ReviewScreen)
- Pantalla de conversaciones con tarjetas por estado y botón WhatsApp para aceptados
- Centro de notificaciones in-app con badge en tiempo real
- Notificaciones push via Expo Push Service
- Perfil de usuario con menú agrupado, disponibilidad y edición completa
- Subida de fotos al perfil del trabajador
- Sistema de membresía Premium (lógica de ordenamiento activa, cobro pendiente)
- Detección de conexión a internet con pantalla de sin red
- Términos de uso y política de privacidad

### Pendiente 🔲
- Pasarela de pago para membresía Premium (PSE / Nequi)
- Verificación de cédula (identidad del trabajador)
- Panel de administración web

---

## Tecnología

- **Mobile:** React Native 0.81.5 + Expo SDK 54 (iOS y Android desde un mismo código)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Auth:** Twilio SMS — OTP vía Supabase Phone Auth
- **Notificaciones push:** Expo Push Notifications (Expo Push Service)
- **Comunicación:** WhatsApp (apertura directa vía deep link `wa.me/`)
- **Distribución:** EAS Build (Expo Application Services)

---

## Modelo de negocio

Ver [monetizacion.md](monetizacion.md) para detalle completo.

**Resumen:** Freemium. La app es gratuita para todos. Los trabajadores pueden contratar membresía Premium ($29.900/mes COP) para aparecer primero en las búsquedas. Los clientes tienen una opción Premium ($19.900/mes COP) para publicaciones destacadas sin límites.
