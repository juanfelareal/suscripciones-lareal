import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as payu from '@/lib/gateways/payu'
import * as wompi from '@/lib/gateways/wompi'
import { calculateNextBillingDate } from '@/lib/billing'

/**
 * API para crear suscripciones desde apps externas (como Tranki)
 *
 * POST /api/v1/merchants/gratu/subscribe
 *
 * Body:
 * {
 *   "planId": "uuid-del-plan",
 *   "customer": {
 *     "email": "usuario@email.com",
 *     "name": "Juan Pérez",
 *     "phone": "+57 300 123 4567",
 *     "documentType": "CC",
 *     "documentNumber": "123456789"
 *   },
 *   "card": {
 *     "number": "4111111111111111",
 *     "expMonth": "12",
 *     "expYear": "2028",
 *     "cvv": "123",
 *     "holderName": "JUAN PEREZ"
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantSlug: string }> }
) {
  const { merchantSlug } = await params

  try {
    const body = await request.json()
    const { planId, customer, card } = body

    // Validaciones
    if (!planId || !customer?.email || !customer?.name || !card?.number) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos: planId, customer.email, customer.name, card.number'
      }, { status: 400 })
    }

    // Obtener merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('slug', merchantSlug)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({
        success: false,
        error: 'Merchant no encontrado'
      }, { status: 404 })
    }

    // Obtener plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({
        success: false,
        error: 'Plan no encontrado o no disponible'
      }, { status: 404 })
    }

    // Crear o actualizar customer
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('email', customer.email)
      .single()

    let customerId: string

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Actualizar datos del cliente
      await supabaseAdmin
        .from('customers')
        .update({
          name: customer.name,
          phone: customer.phone,
          document_type: customer.documentType,
          document_number: customer.documentNumber
        })
        .eq('id', customerId)
    } else {
      // Crear nuevo cliente
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          merchant_id: merchant.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          document_type: customer.documentType,
          document_number: customer.documentNumber
        })
        .select()
        .single()

      if (customerError || !newCustomer) {
        return NextResponse.json({
          success: false,
          error: 'Error al crear el cliente'
        }, { status: 500 })
      }

      customerId = newCustomer.id
    }

    // Tokenizar tarjeta según el gateway del merchant
    const gatewayConfig = merchant.gateway_config as any
    let tokenResult: { success: boolean; token?: string; lastFour?: string; brand?: string; error?: string }

    if (merchant.gateway === 'payu') {
      const payuConfig: payu.PayUConfig = {
        apiKey: gatewayConfig.apiKey,
        apiLogin: gatewayConfig.apiLogin,
        merchantId: gatewayConfig.merchantId,
        accountId: gatewayConfig.accountId,
        isProduction: gatewayConfig.isProduction
      }

      const cardBrand = payu.detectCardBrand(card.number)

      const result = await payu.tokenizeCard(payuConfig, {
        payerId: customerId,
        name: card.holderName || customer.name,
        identificationNumber: customer.documentNumber || customerId,
        paymentMethod: cardBrand,
        number: card.number.replace(/\s/g, ''),
        expirationDate: `20${card.expYear}/${card.expMonth}`
      })

      tokenResult = {
        success: result.success,
        token: result.creditCardTokenId,
        lastFour: result.maskedNumber?.slice(-4),
        brand: cardBrand,
        error: result.errorMessage
      }

    } else if (merchant.gateway === 'wompi') {
      const wompiConfig: wompi.WompiConfig = {
        publicKey: gatewayConfig.publicKey,
        privateKey: gatewayConfig.privateKey,
        eventsSecret: gatewayConfig.eventsSecret,
        isProduction: gatewayConfig.isProduction
      }

      // Tokenizar
      const tokenRes = await wompi.tokenizeCard(wompiConfig, {
        number: card.number.replace(/\s/g, ''),
        exp_month: card.expMonth,
        exp_year: card.expYear,
        cvc: card.cvv,
        card_holder: card.holderName || customer.name
      })

      if (!tokenRes.success || !tokenRes.tokenId) {
        tokenResult = {
          success: false,
          error: tokenRes.errorMessage
        }
      } else {
        // Crear payment source
        const { token: acceptanceToken } = await wompi.getAcceptanceToken(wompiConfig)
        const sourceRes = await wompi.createPaymentSource(
          wompiConfig,
          tokenRes.tokenId,
          customer.email,
          acceptanceToken || ''
        )

        tokenResult = {
          success: sourceRes.success,
          token: sourceRes.sourceId,
          lastFour: tokenRes.lastFour,
          brand: tokenRes.brand,
          error: sourceRes.error
        }
      }
    } else {
      return NextResponse.json({
        success: false,
        error: `Gateway ${merchant.gateway} no soportado`
      }, { status: 400 })
    }

    if (!tokenResult.success || !tokenResult.token) {
      return NextResponse.json({
        success: false,
        error: `Error al procesar la tarjeta: ${tokenResult.error}`
      }, { status: 400 })
    }

    // Guardar método de pago
    const { data: paymentMethod, error: pmError } = await supabaseAdmin
      .from('payment_methods')
      .insert({
        customer_id: customerId,
        merchant_id: merchant.id,
        gateway: merchant.gateway,
        token: tokenResult.token,
        card_last_four: tokenResult.lastFour,
        card_brand: tokenResult.brand,
        card_exp_month: card.expMonth,
        card_exp_year: card.expYear,
        cardholder_name: card.holderName || customer.name,
        is_default: true
      })
      .select()
      .single()

    if (pmError || !paymentMethod) {
      return NextResponse.json({
        success: false,
        error: 'Error al guardar el método de pago'
      }, { status: 500 })
    }

    // Calcular fechas
    const now = new Date()
    const trialEnd = plan.trial_days > 0
      ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
      : null

    const nextBillingDate = trialEnd || calculateNextBillingDate(now, plan.interval, plan.interval_count)

    // Crear suscripción
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        merchant_id: merchant.id,
        customer_id: customerId,
        plan_id: plan.id,
        payment_method_id: paymentMethod.id,
        status: trialEnd ? 'trialing' : 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextBillingDate.toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
        trial_end: trialEnd?.toISOString()
      })
      .select()
      .single()

    if (subError || !subscription) {
      return NextResponse.json({
        success: false,
        error: 'Error al crear la suscripción'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
        plan: {
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval
        },
        trialEndsAt: trialEnd?.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
        paymentMethod: {
          brand: tokenResult.brand,
          lastFour: tokenResult.lastFour
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno'
    }, { status: 500 })
  }
}

/**
 * GET - Obtener planes disponibles del merchant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantSlug: string }> }
) {
  const { merchantSlug } = await params

  // Obtener merchant
  const { data: merchant, error: merchantError } = await supabaseAdmin
    .from('merchants')
    .select('id, name, logo_url')
    .eq('slug', merchantSlug)
    .single()

  if (merchantError || !merchant) {
    return NextResponse.json({
      success: false,
      error: 'Merchant no encontrado'
    }, { status: 404 })
  }

  // Obtener planes públicos
  const { data: plans, error: plansError } = await supabaseAdmin
    .from('plans')
    .select('id, name, description, price, currency, interval, interval_count, features, trial_days')
    .eq('merchant_id', merchant.id)
    .eq('is_active', true)
    .eq('is_public', true)
    .order('price', { ascending: true })

  if (plansError) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener planes'
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      merchant: {
        name: merchant.name,
        logoUrl: merchant.logo_url
      },
      plans
    }
  })
}
