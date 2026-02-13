import { NextRequest, NextResponse } from 'next/server'

/**
 * API para registrar tokens de tarjeta desde checkouts externos
 * 
 * El comercio tokeniza en su pasarela (PayU, Wompi, etc.)
 * y nos envía el token para programar cobros recurrentes
 * 
 * POST /api/v1/tokens
 */

interface TokenRegistration {
  // Datos del cliente
  customer: {
    email: string
    name: string
    phone?: string
    documentType?: string  // CC, CE, NIT, etc.
    documentNumber?: string
  }
  // Token de la pasarela
  paymentToken: string
  gateway: 'payu' | 'wompi' | 'mercadopago'
  // Metadata de la tarjeta (opcional, para mostrar al usuario)
  cardInfo?: {
    lastFour: string
    brand: string  // visa, mastercard, amex
    expiryMonth: string
    expiryYear: string
  }
  // Plan al que se suscribe
  planId: string
  // Metadata adicional del comercio
  metadata?: Record<string, any>
}

// Simulación de almacenamiento
const registeredTokens: any[] = []

export async function POST(request: NextRequest) {
  try {
    // Verificar API Key del comercio
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key required',
        code: 'MISSING_API_KEY'
      }, { status: 401 })
    }

    // En producción: validar API key contra base de datos
    // const merchant = await validateApiKey(apiKey)

    const body: TokenRegistration = await request.json()
    const { customer, paymentToken, gateway, cardInfo, planId, metadata } = body

    // Validaciones
    if (!customer?.email || !paymentToken || !gateway || !planId) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer.email, paymentToken, gateway, planId',
        code: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    // Crear registro de suscripción
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
      customer,
      paymentToken,
      gateway,
      cardInfo,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: calculateNextBillingDate('monthly'), // En producción: según el plan
      nextBillingDate: calculateNextBillingDate('monthly'),
      metadata,
      createdAt: new Date()
    }

    registeredTokens.push(subscription)

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        status: subscription.status,
        nextBillingDate: subscription.nextBillingDate,
        message: 'Token registered successfully. Recurring billing is now active.'
      }
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request body',
      code: 'PARSE_ERROR'
    }, { status: 400 })
  }
}

function calculateNextBillingDate(interval: string): Date {
  const date = new Date()
  switch (interval) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'biweekly':
      date.setDate(date.getDate() + 15)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      date.setMonth(date.getMonth() + 1)
  }
  return date
}

/**
 * GET /api/v1/tokens - Listar tokens/suscripciones del comercio
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'API key required',
      code: 'MISSING_API_KEY'
    }, { status: 401 })
  }

  // En producción: filtrar por merchantId del API key
  return NextResponse.json({
    success: true,
    data: registeredTokens
  })
}
