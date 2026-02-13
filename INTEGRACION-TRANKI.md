# Integración de Tranki con Suscripciones LA REAL

## Resumen

Tranki (GRATU) usará la plataforma Suscripciones de LA REAL para gestionar los pagos recurrentes de sus usuarios Pro.

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Usuario de    │   →→→   │   Suscripciones │   →→→   │     PayU        │
│     Tranki      │         │    LA REAL      │         │   (de GRATU)    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Paso 1: Configurar el proyecto Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el SQL en `supabase-schema.sql` en el SQL Editor
3. Copiar las credenciales al `.env.local`

## Paso 2: Configurar PayU de GRATU

Actualizar el registro de GRATU en la tabla `merchants`:

```sql
UPDATE merchants
SET gateway_config = '{
  "apiKey": "TU_API_KEY_REAL",
  "apiLogin": "TU_API_LOGIN_REAL",
  "merchantId": "TU_MERCHANT_ID_REAL",
  "accountId": "TU_ACCOUNT_ID_REAL",
  "isProduction": true
}'::jsonb
WHERE slug = 'gratu';
```

## Paso 3: Integrar en el frontend de Tranki

### Opción A: Usar el SDK (recomendado)

Copiar el archivo `sdk/client.ts` a Tranki:

```bash
cp sdk/client.ts /ruta/a/tranki/frontend/src/lib/suscripciones-client.ts
```

Usar en la app:

```typescript
// frontend/src/lib/suscripciones.ts
import { SuscripcionesClient } from './suscripciones-client'

export const suscripciones = new SuscripcionesClient({
  merchantSlug: 'gratu',
  baseUrl: process.env.NEXT_PUBLIC_SUSCRIPCIONES_URL || 'https://suscripciones.lareal.co'
})
```

### Opción B: Llamadas directas a la API

```typescript
const SUSCRIPCIONES_URL = 'https://suscripciones.lareal.co/api/v1/merchants/gratu'

// Verificar si usuario tiene suscripción
async function checkSubscription(email: string) {
  const res = await fetch(`${SUSCRIPCIONES_URL}/customers/${email}/subscription`)
  return res.json()
}

// Crear suscripción
async function subscribe(data: { planId: string, customer: any, card: any }) {
  const res = await fetch(`${SUSCRIPCIONES_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}
```

## Paso 4: Verificar suscripción en el backend de Tranki

En las funciones de Tranki que requieren Pro, verificar la suscripción:

```javascript
// api/budgets.js (ejemplo)
import { createClient } from '@supabase/supabase-js'

const SUSCRIPCIONES_URL = process.env.SUSCRIPCIONES_URL || 'https://suscripciones.lareal.co'

async function checkProAccess(userEmail) {
  const res = await fetch(
    `${SUSCRIPCIONES_URL}/api/v1/merchants/gratu/customers/${encodeURIComponent(userEmail)}/subscription`
  )
  const data = await res.json()

  return data.success && data.data.hasSubscription && data.data.isActive
}

// En el handler
async function handler(req, res) {
  const isPro = await checkProAccess(req.user.email)

  if (!isPro) {
    return res.status(403).json({
      error: 'Esta función requiere Tranki Pro',
      upgradeUrl: '/upgrade'
    })
  }

  // ... continuar con la lógica
}
```

## Paso 5: Página de Upgrade en Tranki

Crear una página `/upgrade` en Tranki que muestre los planes y el formulario de pago:

```tsx
// frontend/src/app/upgrade/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { suscripciones } from '@/lib/suscripciones'

export default function UpgradePage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    suscripciones.getPlans().then(({ plans }) => {
      setPlans(plans || [])
    })
  }, [])

  async function handleSubmit(formData) {
    setLoading(true)

    const result = await suscripciones.subscribe({
      planId: selectedPlan.id,
      customer: {
        email: formData.email,
        name: formData.name,
        phone: formData.phone
      },
      card: {
        number: formData.cardNumber,
        expMonth: formData.expMonth,
        expYear: formData.expYear,
        cvv: formData.cvv,
        holderName: formData.cardHolder
      }
    })

    setLoading(false)

    if (result.success) {
      // Redirigir a página de éxito
      window.location.href = '/upgrade/success'
    } else {
      alert(result.error)
    }
  }

  return (
    <div>
      <h1>Upgrade a Tranki Pro</h1>

      {/* Mostrar planes */}
      <div className="plans-grid">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan?.id === plan.id}
            onSelect={() => setSelectedPlan(plan)}
          />
        ))}
      </div>

      {/* Formulario de pago */}
      {selectedPlan && (
        <PaymentForm onSubmit={handleSubmit} loading={loading} />
      )}
    </div>
  )
}
```

## Endpoints disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/merchants/gratu/subscribe` | Obtener planes disponibles |
| POST | `/api/v1/merchants/gratu/subscribe` | Crear suscripción |
| GET | `/api/v1/merchants/gratu/customers/{email}/subscription` | Verificar suscripción |
| GET | `/api/v1/merchants/gratu/subscriptions/{id}` | Detalles de suscripción |
| PATCH | `/api/v1/merchants/gratu/subscriptions/{id}` | Pausar/cancelar/cambiar plan |
| DELETE | `/api/v1/merchants/gratu/subscriptions/{id}` | Cancelar inmediatamente |

## Flujo de cobro automático

1. El cron job se ejecuta diariamente a las 6:00 AM
2. Busca suscripciones con `next_billing_date <= hoy`
3. Intenta cobrar via PayU usando el token guardado
4. Si el cobro es exitoso:
   - Actualiza `next_billing_date`
   - Crea registro en `invoices`
5. Si falla:
   - Reintenta en 24h (máx 3 intentos)
   - Después del 3er intento, marca como `past_due`

## Variables de entorno para Tranki

```env
# URL de la plataforma de suscripciones
NEXT_PUBLIC_SUSCRIPCIONES_URL=https://suscripciones.lareal.co
SUSCRIPCIONES_URL=https://suscripciones.lareal.co
```

## Pruebas en sandbox

Para probar, usa las tarjetas de prueba de PayU:

| Tarjeta | Número | CVV | Fecha |
|---------|--------|-----|-------|
| VISA Aprobada | 4111111111111111 | 123 | 12/28 |
| VISA Rechazada | 4000000000000002 | 123 | 12/28 |
| Mastercard | 5500000000000004 | 123 | 12/28 |
