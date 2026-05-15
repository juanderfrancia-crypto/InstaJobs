# Resumen Ejecutivo — InstaJobs

**Versión:** 1.0.0  
**Fecha:** Mayo 2026  
**Estado:** MVP en desarrollo activo

---

## ¿Qué es InstaJobs?

InstaJobs es un marketplace móvil que conecta trabajadores independientes de oficios con clientes en municipios, veredas y pequeñas ciudades de Colombia.

El problema que resuelve: en zonas rurales y pequeñas ciudades no existe una plataforma local que conecte la oferta y demanda de servicios del hogar (plomería, electricidad, construcción, etc.). Los clientes consiguen trabajadores por voz a voz, y los trabajadores dependen de referidos para conseguir trabajo.

---

## Mercado objetivo

**Geografía inicial:** Colombia  
Municipios cubiertos: Rionegro, La Ceja, El Retiro, Marinilla, El Carmen de Viboral, Guarne, San Vicente Ferrer, La Unión, Abejorral, Cocorná, Granada, Santuario, El Peñol, Guatapé, San Rafael, San Carlos, Alejandría, Concepción y más.

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

Plomería · Electricidad · Construcción · Pintura · Jardinería · Techos · Albañilería · Puertas y Ventanas · Repello · Ayudante día · Carpintería · Soldadura

---

## Estado actual del MVP (Mayo 2026)

### Completado ✅
- Autenticación por SMS/OTP (Twilio + Supabase Phone Auth)
- Onboarding diferenciado por rol (cliente / trabajador)
- Home con lista dinámica según rol, búsqueda inline y filtros por categoría
- Búsqueda avanzada con filtros por categoría, municipio y texto
- Publicación de trabajos con urgencia y presupuesto
- Perfil completo del trabajador con stats, reseñas y contacto WhatsApp
- Detalle del trabajo con aplicación mediante mensaje
- Pantalla de conversaciones con datos reales de Supabase
- Perfil de usuario con toggle de disponibilidad
- Sistema de membresía Premium (UI lista, lógica pendiente)

### Pendiente 🔲
- Notificaciones push (Expo Notifications)
- Pasarela de pago para membresía Premium (PSE / Nequi)
- Verificación de cédula (identidad del trabajador)
- Panel de administración web
- Calificación y reseña post-trabajo
- Subida de fotos al perfil del trabajador

---

## Tecnología

- **Mobile:** React Native + Expo (iOS y Android desde un mismo código)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Auth:** Twilio SMS — número canadiense (+1) para OTP
- **Comunicación:** WhatsApp (apertura directa vía deep link)

---

## Modelo de negocio

Ver [monetizacion.md](monetizacion.md) para detalle completo.

**Resumen:** Freemium. La app es gratuita para todos. Los trabajadores pueden contratar membresía Premium ($29.900/mes COP) para aparecer primero en las búsquedas. Los clientes tienen una opción Premium ($19.900/mes COP) para publicaciones destacadas sin límites.
