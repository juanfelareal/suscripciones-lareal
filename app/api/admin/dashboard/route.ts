import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET - Obtener datos del dashboard del merchant
 */
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get('merchantId')

  if (!merchantId) {
    return NextResponse.json({ success: false, error: 'merchantId requerido' }, { status: 400 })
  }

  // Verificar que el usuario pertenece al merchant
  const user = session.user as any
  if (user.merchantId !== merchantId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
  }

  try {
    // Obtener suscripciones activas
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        status,
        plan:plans(price, currency, interval)
      `)
      .eq('merchant_id', merchantId)

    if (subError) throw subError

    // Calcular métricas
    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || []
    const cancelledSubscriptions = subscriptions?.filter(s => s.status === 'cancelled') || []

    // MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const plan = sub.plan as any
      if (!plan) return sum

      let monthlyValue = plan.price
      if (plan.interval === 'yearly') monthlyValue = plan.price / 12
      if (plan.interval === 'quarterly') monthlyValue = plan.price / 3
      if (plan.interval === 'weekly') monthlyValue = plan.price * 4
      if (plan.interval === 'daily') monthlyValue = plan.price * 30

      return sum + monthlyValue
    }, 0)

    // Churn rate
    const totalSubs = subscriptions?.length || 0
    const churnRate = totalSubs > 0
      ? ((cancelledSubscriptions.length / totalSubs) * 100).toFixed(1)
      : 0

    // LTV (asumiendo 12 meses promedio)
    const avgPlanPrice = activeSubscriptions.length > 0
      ? activeSubscriptions.reduce((sum, sub) => {
          const plan = sub.plan as any
          return sum + (plan?.price || 0)
        }, 0) / activeSubscriptions.length
      : 0
    const ltv = avgPlanPrice * 12

    // Cobros pendientes y fallidos
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .eq('merchant_id', merchantId)
      .in('status', ['pending', 'failed'])

    const pendingCharges = invoices?.filter(i => i.status === 'pending').length || 0
    const failedCharges = invoices?.filter(i => i.status === 'failed').length || 0

    // Transacciones recientes
    const { data: recentTransactions } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        amount,
        status,
        created_at,
        customer:customers(name, email),
        plan:subscriptions(plan:plans(name))
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(5)

    const formattedTransactions = recentTransactions?.map(tx => ({
      id: tx.id,
      amount: tx.amount,
      status: tx.status,
      created_at: tx.created_at,
      customer_name: (tx.customer as any)?.name || 'Sin nombre',
      customer_email: (tx.customer as any)?.email || '',
      plan_name: (tx.plan as any)?.plan?.name || 'Plan'
    })) || []

    return NextResponse.json({
      success: true,
      metrics: {
        mrr: Math.round(mrr),
        activeSubscribers: activeSubscriptions.length,
        churnRate: parseFloat(churnRate as string),
        ltv: Math.round(ltv),
        pendingCharges,
        failedCharges
      },
      recentTransactions: formattedTransactions
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos'
    }, { status: 500 })
  }
}
