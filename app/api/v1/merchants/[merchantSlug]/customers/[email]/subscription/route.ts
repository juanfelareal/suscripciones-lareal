import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API para consultar la suscripción de un cliente por email
 * Útil para que Tranki consulte si un usuario tiene suscripción activa
 *
 * GET /api/v1/merchants/gratu/customers/usuario@email.com/subscription
 *
 * Headers:
 *   x-api-key: API key del merchant
 */

interface RouteParams {
  merchantSlug: string
  email: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { merchantSlug, email } = await params
  const decodedEmail = decodeURIComponent(email)

  // Verificar API key (opcional pero recomendado)
  const apiKey = request.headers.get('x-api-key')

  // Obtener merchant
  const { data: merchant, error: merchantError } = await supabaseAdmin
    .from('merchants')
    .select('id, name')
    .eq('slug', merchantSlug)
    .single()

  if (merchantError || !merchant) {
    return NextResponse.json({
      success: false,
      error: 'Merchant no encontrado'
    }, { status: 404 })
  }

  // TODO: Validar API key contra merchant si se requiere autenticación

  // Buscar cliente
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('merchant_id', merchant.id)
    .eq('email', decodedEmail)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: false,
        subscription: null
      }
    })
  }

  // Buscar suscripción activa
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      id,
      status,
      current_period_start,
      current_period_end,
      next_billing_date,
      trial_end,
      cancel_at_period_end,
      billing_cycle_count,
      plan:plans(
        id,
        name,
        price,
        currency,
        interval,
        features
      )
    `)
    .eq('customer_id', customer.id)
    .eq('merchant_id', merchant.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (subError || !subscription) {
    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: false,
        subscription: null
      }
    })
  }

  // Determinar si está activo (incluyendo trial)
  const isActive = ['active', 'trialing'].includes(subscription.status)
  const isTrial = subscription.status === 'trialing'
  const isPastDue = subscription.status === 'past_due'

  return NextResponse.json({
    success: true,
    data: {
      hasSubscription: true,
      isActive,
      isTrial,
      isPastDue,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        billingCycleCount: subscription.billing_cycle_count
      }
    }
  })
}
