import { NextRequest, NextResponse } from 'next/server'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  intervalCount: number
  features: string[]
  active: boolean
  merchantId: string
  createdAt: Date
  updatedAt: Date
}

// Simulación de base de datos
const plans: Plan[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get('merchantId')
  
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
  }

  const merchantPlans = plans.filter(p => p.merchantId === merchantId && p.active)
  
  return NextResponse.json({ plans: merchantPlans })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, currency, interval, features, merchantId } = body

    if (!name || !price || !interval || !merchantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const plan: Plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: description || '',
      price,
      currency: currency || 'COP',
      interval,
      intervalCount: 1,
      features: features || [],
      active: true,
      merchantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    plans.push(plan)

    return NextResponse.json({ 
      success: true, 
      plan,
      message: 'Plan created successfully'
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, ...updates } = body

    if (!planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 })
    }

    const planIndex = plans.findIndex(p => p.id === planId)
    if (planIndex === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    plans[planIndex] = {
      ...plans[planIndex],
      ...updates,
      updatedAt: new Date()
    }

    return NextResponse.json({ 
      success: true, 
      plan: plans[planIndex],
      message: 'Plan updated successfully'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('planId')
  
  if (!planId) {
    return NextResponse.json({ error: 'planId required' }, { status: 400 })
  }

  const planIndex = plans.findIndex(p => p.id === planId)
  if (planIndex === -1) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Soft delete - solo desactivar
  plans[planIndex].active = false
  plans[planIndex].updatedAt = new Date()

  return NextResponse.json({ 
    success: true, 
    message: 'Plan deleted successfully'
  })
}
