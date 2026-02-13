import { NextRequest, NextResponse } from 'next/server'
import { processPendingCharges, chargeMerchant } from '@/lib/billing'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Cron Job para procesar cobros automáticos
 * Se ejecuta diariamente via Vercel Cron
 *
 * Configurar en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/billing",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verificar autorización (Vercel Cron o secret)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron envía un header especial
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    subscriptionCharges: { processed: 0, successful: 0, failed: 0 },
    merchantCharges: { processed: 0, successful: 0, failed: 0 },
    errors: [] as string[]
  }

  try {
    // 1. Procesar cobros de suscripciones (merchants cobran a sus clientes)
    console.log('Processing subscription charges...')
    const subscriptionResults = await processPendingCharges()

    results.subscriptionCharges = {
      processed: subscriptionResults.processed,
      successful: subscriptionResults.successful,
      failed: subscriptionResults.failed
    }

    console.log(`Subscription charges: ${subscriptionResults.successful}/${subscriptionResults.processed} successful`)

    // 2. Procesar cobros a merchants (LA REAL cobra a GRATU, etc.)
    console.log('Processing merchant charges...')

    const { data: merchantsDue, error } = await supabaseAdmin
      .from('merchants')
      .select('id, name')
      .eq('subscription_status', 'active')
      .lte('next_platform_billing', new Date().toISOString().split('T')[0])

    if (!error && merchantsDue) {
      for (const merchant of merchantsDue) {
        console.log(`Charging merchant: ${merchant.name}`)
        const chargeResult = await chargeMerchant(merchant.id)

        results.merchantCharges.processed++

        if (chargeResult.success) {
          results.merchantCharges.successful++
          console.log(`  ✓ Merchant ${merchant.name} charged successfully`)
        } else {
          results.merchantCharges.failed++
          results.errors.push(`Merchant ${merchant.name}: ${chargeResult.error}`)
          console.log(`  ✗ Merchant ${merchant.name} charge failed: ${chargeResult.error}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('Billing cron error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request)
}
