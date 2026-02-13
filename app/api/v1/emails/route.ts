import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, type EmailType, type EmailData } from '@/lib/email'

/**
 * API para enviar emails transaccionales
 * POST /api/v1/emails
 * 
 * Los emails se envían automáticamente en eventos de suscripción,
 * pero también puedes dispararlos manualmente con esta API.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key required',
        code: 'MISSING_API_KEY'
      }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body as { type: EmailType; data: EmailData }

    if (!type || !data?.to || !data?.customerName) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, data.to, data.customerName',
        code: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    // Enviar email
    const result = await sendEmail(type, data)

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.data?.id,
        type,
        to: data.to
      }
    })

  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      code: 'EMAIL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/v1/emails/templates - Listar templates disponibles
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    templates: [
      {
        type: 'welcome',
        name: 'Bienvenida',
        description: 'Se envía cuando se activa una nueva suscripción',
        requiredFields: ['to', 'customerName', 'planName', 'businessName']
      },
      {
        type: 'payment_success',
        name: 'Pago exitoso',
        description: 'Se envía después de cada cobro exitoso',
        requiredFields: ['to', 'customerName', 'planName', 'amount', 'nextBillingDate', 'businessName']
      },
      {
        type: 'payment_failed',
        name: 'Pago fallido',
        description: 'Se envía cuando un cobro falla',
        requiredFields: ['to', 'customerName', 'planName', 'amount', 'businessName']
      },
      {
        type: 'renewal_reminder',
        name: 'Recordatorio de renovación',
        description: 'Se envía 3 días antes de la renovación',
        requiredFields: ['to', 'customerName', 'planName', 'amount', 'nextBillingDate', 'businessName']
      },
      {
        type: 'cancellation',
        name: 'Cancelación',
        description: 'Se envía cuando se cancela una suscripción',
        requiredFields: ['to', 'customerName', 'planName', 'nextBillingDate', 'businessName']
      }
    ]
  })
}
