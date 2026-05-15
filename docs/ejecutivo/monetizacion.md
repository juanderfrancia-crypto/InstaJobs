# Modelo de Negocio y Monetización — InstaJobs

**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Modelo Freemium

La app es completamente gratuita para uso básico. Los ingresos vienen de membresías Premium opcionales para quienes quieran más visibilidad.

---

## Planes

### Trabajador Gratuito (Free)
- Perfil en la plataforma
- Aparece en búsquedas (orden por defecto)
- Puede aplicar a trabajos publicados
- Recibe contactos por WhatsApp
- **Precio:** $0/mes

### Trabajador Premium
- Todo lo del plan gratuito
- **Aparece primero** en búsquedas y en el Home de clientes (ordenado por `membership_tier`)
- Badge "Pro" visible en su perfil
- **Precio:** $29.900/mes COP

### Cliente Gratuito (Free)
- Publica trabajos (límite por definir)
- Busca y contacta trabajadores
- **Precio:** $0/mes

### Cliente Premium
- Publicaciones destacadas sin límites
- Mayor visibilidad para sus publicaciones
- **Precio:** $19.900/mes COP

---

## Implementación técnica actual

El campo `membership_tier` en `worker_profiles` tiene valores `'free'` | `'premium'`.

Las búsquedas en HomeScreen y SearchScreen ordenan por `membership_tier DESC`, lo que naturalmente pone a los trabajadores Premium primero:

```ts
.order('membership_tier', { ascending: false })
// 'premium' > 'free' alfabéticamente → Premium aparece primero
```

---

## Proyección de ingresos (referencia)

| Trabajadores activos | Conversión Premium (5%) | Ingreso mensual |
|---|---|---|
| 200 | 10 | $299.000 COP |
| 500 | 25 | $747.500 COP |
| 1.000 | 50 | $1.495.000 COP |
| 5.000 | 250 | $7.475.000 COP |

---

## Pasarela de pago (pendiente)

Para procesar los pagos de membresía se evaluarán:
- **Nequi / Daviplata** — billeteras digitales muy usadas en Colombia
- **PSE** — débito bancario directo
- **PayU Colombia** — integración con múltiples medios de pago
- **Stripe** (si se expande a mercados internacionales)

La suscripción recurrente mensual se maneja en el backend con webhooks de confirmación de pago que actualizan el campo `membership_tier` en Supabase.
