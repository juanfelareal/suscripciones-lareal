import { NextRequest, NextResponse } from 'next/server'

// Tipos para el sistema de suscripciones
interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  features: string[]
  active: boolean
  merchantId: string
  createdAt: Date
}

interface Subscription {
  id: string
  planId: string
  customerId: string
  customerEmail: string
  customerName: string
  paymentToken: string // Token de la pasarela (PayU, Wompi, etc.)
  gateway: 'payu' | 'wompi' | 'mercadopago'
  status: 'active' | 'paused' | 'cancelled' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  nextBillingDate: Date
  merchantId: string
  createdAt: Date
  cancelledAt?: Date
}

// Simulación de base de datos (en producción: PostgreSQL/MySQL)
const subscriptions: Subscription[] = []
const plans: Plan[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get('merchantId')
  
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
  }

  const merchantSubscriptions = subscriptions.filter(s => s.merchantId === merchantId)
  
  // Calcular métricas
  const activeSubscriptions = merchantSubscriptions.filter(s => s.status === 'active')
  const totalMRR = activeSubscriptions.reduce((sum, sub) => {
    const plan = plans.find(p => p.id === sub.planId)
    return sum + (plan?.price || 0)
  }, 0)
  
  return NextResponse.json({
    subscriptions: merchantSubscriptions,
    metrics: {
      total: merchantSubscriptions.length,
      active: activeSubscriptions.length,
      mrr: totalMRR,
      churnRate: merchantSubscriptions.length > 0 
        ? (merchantSubscriptions.filter(s => s.status === 'cancelled').length / merchantSubscriptions.length * 100).toFixed(2)
        : 0
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, customerEmail, customerName, paymentToken, gateway, merchantId } = body

    // Validaciones
    if (!planId || !customerEmail || !paymentToken || !gateway || !merchantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Calcular fechas de facturación
    const now = new Date()
    const nextBilling = new Date(now)
    
    switch (plan.interval) {
      case 'daily':
        nextBilling.setDate(nextBilling.getDate() + 1)
        break
      case 'weekly':
        nextBilling.setDate(nextBilling.getDate() + 7)
        break
      case 'biweekly':
        nextBilling.setDate(nextBilling.getDate() + 15)
        break
      case 'monthly':
        nextBilling.setMonth(nextBilling.getMonth() + 1)
        break
      case 'quarterly':
        nextBilling.setMonth(nextBilling.getMonth() + 3)
        break
      case 'yearly':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1)
        break
    }

    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planId,
      customerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
      customerEmail,
      customerName,
      paymentToken,
      gateway,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextBilling,
      nextBillingDate: nextBilling,
      merchantId,
      createdAt: now
    }

    subscriptions.push(subscription)

    return NextResponse.json({ 
      success: true, 
      subscription,
      message: 'Subscription created successfully'
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
