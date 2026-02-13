import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API para gestionar suscripciones individuales
 *
 * GET /api/v1/merchants/gratu/subscriptions/{subscriptionId}
 * PATCH /api/v1/merchants/gratu/subscriptions/{subscriptionId}
 * DELETE /api/v1/merchants/gratu/subscriptions/{subscriptionId}
 */

interface RouteParams {
  merchantSlug: string
  subscriptionId: string
}

/**
 * GET - Obtener detalles de una suscripción
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { merchantSlug, subscriptionId } = await params

  // Verificar merchant
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('slug', merchantSlug)
    .single()

  if (!merchant) {
    return NextResponse.json({ success: false, error: 'Merchant no encontrado' }, { status: 404 })
  }

  // Obtener suscripción con datos relacionados
  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      customer:customers(id, email, name, phone),
      plan:plans(id, name, price, currency, interval, features),
      payment_method:payment_methods(id, card_brand, card_last_four, card_exp_month, card_exp_year)
    `)
    .eq('id', subscriptionId)
    .eq('merchant_id', merchant.id)
    .single()

  if (error || !subscription) {
    return NextResponse.json({ success: false, error: 'Suscripción no encontrada' }, { status: 404 })
  }

  // Obtener historial de facturas
  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, amount, status, paid_at, created_at')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    success: true,
    data: {
      ...subscription,
      invoices
    }
  })
}

/**
 * PATCH - Actualizar suscripción (pausar, reanudar, cambiar plan)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { merchantSlug, subscriptionId } = await params

  try {
    const body = await request.json()
    const { action, planId, reason } = body

    // Verificar merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('slug', merchantSlug)
      .single()

    if (!merchant) {
      return NextResponse.json({ success: false, error: 'Merchant no encontrado' }, { status: 404 })
    }

    // Verificar que la suscripción existe y pertenece al merchant
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('merchant_id', merchant.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ success: false, error: 'Suscripción no encontrada' }, { status: 404 })
    }

    let updateData: Record<string, any> = {}
    let message = ''

    switch (action) {
      case 'pause':
        if (subscription.status !== 'active') {
          return NextResponse.json({
            success: false,
            error: 'Solo se pueden pausar suscripciones activas'
          }, { status: 400 })
        }
        updateData = { status: 'paused' }
        message = 'Suscripción pausada'
        break

      case 'resume':
        if (subscription.status !== 'paused') {
          return NextResponse.json({
            success: false,
            error: 'Solo se pueden reanudar suscripciones pausadas'
          }, { status: 400 })
        }
        updateData = { status: 'active' }
        message = 'Suscripción reanudada'
        break

      case 'cancel':
        if (['cancelled'].includes(subscription.status)) {
          return NextResponse.json({
            success: false,
            error: 'La suscripción ya está cancelada'
          }, { status: 400 })
        }
        updateData = {
          cancel_at_period_end: true,
          cancellation_reason: reason || 'Cancelado por el usuario'
        }
        message = 'La suscripción se cancelará al final del período actual'
        break

      case 'cancel_immediately':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || 'Cancelado inmediatamente'
        }
        message = 'Suscripción cancelada'
        break

      case 'change_plan':
        if (!planId) {
          return NextResponse.json({
            success: false,
            error: 'Se requiere planId para cambiar de plan'
          }, { status: 400 })
        }

        // Verificar que el nuevo plan existe
        const { data: newPlan } = await supabaseAdmin
          .from('plans')
          .select('id')
          .eq('id', planId)
          .eq('merchant_id', merchant.id)
          .eq('is_active', true)
          .single()

        if (!newPlan) {
          return NextResponse.json({
            success: false,
            error: 'Plan no encontrado'
          }, { status: 404 })
        }

        updateData = { plan_id: planId }
        message = 'Plan actualizado'
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida. Usa: pause, resume, cancel, cancel_immediately, change_plan'
        }, { status: 400 })
    }

    // Actualizar suscripción
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar la suscripción'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message,
      data: updated
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno'
    }, { status: 500 })
  }
}

/**
 * DELETE - Cancelar suscripción inmediatamente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { merchantSlug, subscriptionId } = await params

  // Verificar merchant
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('slug', merchantSlug)
    .single()

  if (!merchant) {
    return NextResponse.json({ success: false, error: 'Merchant no encontrado' }, { status: 404 })
  }

  // Cancelar
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelado via API'
    })
    .eq('id', subscriptionId)
    .eq('merchant_id', merchant.id)

  if (error) {
    return NextResponse.json({
      success: false,
      error: 'Error al cancelar la suscripción'
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Suscripción cancelada'
  })
}
