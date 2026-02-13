import { NextRequest, NextResponse } from 'next/server'
import { processCharge, calculatePlatformFee, type GatewayConfig, type Gateway } from '@/lib/billing'

/**
 * API para procesar cobros manualmente o via cron
 * POST /api/billing/process
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      subscriptionId,
      merchantId,
      gateway,
      token,
      amount,
      currency,
      apiKey,
      payerEmail,
      payerName,
      payerPhone,
      description
    } = body

    // Validaciones
    if (!subscriptionId || !merchantId || !gateway || !token || !amount) {
      return NextResponse.json({
        error: 'Missing required fields: subscriptionId, merchantId, gateway, token, amount'
      }, { status: 400 })
    }

    // Configurar gateway
    const config: GatewayConfig = {
      gateway: gateway as Gateway,
      apiKey: apiKey || process.env[`${gateway.toUpperCase()}_API_KEY`] || '',
      merchantId,
      isProduction: process.env.NODE_ENV === 'production'
    }

    // Procesar cobro
    const result = await processCharge(
      gateway,
      token,
      amount,
      currency || 'COP',
      config,
      {
        referenceCode: `SUB-${subscriptionId}-${Date.now()}`,
        description: description || 'Cobro de suscripción',
        payerId: subscriptionId,
        payerEmail: payerEmail || 'no-email@example.com',
        payerName: payerName || 'Cliente',
        payerPhone: payerPhone
      }
    )

    if (result.success) {
      // Calcular fee de la plataforma
      const platformFee = calculatePlatformFee(amount)
      
      return NextResponse.json({
        success: true,
        transaction: {
          id: result.transactionId,
          subscriptionId,
          amount,
          platformFee,
          netAmount: amount - platformFee,
          gateway: result.gateway,
          timestamp: result.timestamp
        },
        message: 'Charge processed successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Charge failed'
      }, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}

/**
 * Webhook para recibir notificaciones de las pasarelas
 * POST /api/billing/process?webhook=true
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const gateway = searchParams.get('gateway')

    // Procesar según la pasarela
    switch (gateway) {
      case 'payu':
        return handlePayUWebhook(body)
      case 'wompi':
        return handleWompiWebhook(body)
      case 'mercadopago':
        return handleMercadoPagoWebhook(body)
      default:
        return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePayUWebhook(payload: any) {
  // Estructura de webhook de PayU
  const { state_pol, reference_sale, value, currency } = payload
  
  // state_pol: 4 = aprobado, 5 = expirado, 6 = rechazado
  const isApproved = state_pol === '4'
  
  if (isApproved) {
    // Actualizar suscripción como pagada
    // Enviar confirmación al cliente
  } else {
    // Marcar como fallido
    // Programar reintento
  }

  return NextResponse.json({ received: true })
}

async function handleWompiWebhook(payload: any) {
  // Estructura de webhook de Wompi
  const { event, data } = payload
  const { transaction } = data || {}
  
  if (event === 'transaction.updated' && transaction?.status === 'APPROVED') {
    // Actualizar suscripción
  }

  return NextResponse.json({ received: true })
}

async function handleMercadoPagoWebhook(payload: any) {
  // Estructura de webhook de MercadoPago
  const { type, data } = payload
  
  if (type === 'payment' && data?.id) {
    // Consultar estado del pago
    // Actualizar suscripción
  }

  return NextResponse.json({ received: true })
}
