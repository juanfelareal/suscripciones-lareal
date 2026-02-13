/**
 * Motor de Cobros Recurrentes
 * Orquesta las integraciones con PayU, Wompi y MercadoPago
 */

import * as payu from './gateways/payu'
import * as wompi from './gateways/wompi'
import { supabaseAdmin, type Merchant, type Subscription, type Invoice, type PaymentMethod } from './supabase'

export type Gateway = 'payu' | 'wompi' | 'mercadopago'

export interface ChargeResult {
  success: boolean
  transactionId?: string
  error?: string
  gateway: Gateway
  amount: number
  currency: string
  timestamp: Date
  rawResponse?: any
}

export interface GatewayConfig {
  gateway: Gateway
  apiKey: string
  apiLogin?: string
  merchantId: string
  accountId?: string
  publicKey?: string
  privateKey?: string
  eventsSecret?: string
  isProduction: boolean
}

/**
 * Procesar cobro con PayU
 */
async function chargeWithPayU(
  token: string,
  amount: number,
  currency: string,
  config: GatewayConfig,
  metadata: {
    referenceCode: string
    description: string
    payerId: string
    payerEmail: string
    payerName: string
    payerPhone?: string
  }
): Promise<ChargeResult> {
  const payuConfig: payu.PayUConfig = {
    apiKey: config.apiKey,
    apiLogin: config.apiLogin || '',
    merchantId: config.merchantId,
    accountId: config.accountId || '',
    isProduction: config.isProduction
  }

  const result = await payu.chargeWithToken(payuConfig, {
    referenceCode: metadata.referenceCode,
    description: metadata.description,
    amount,
    currency,
    creditCardTokenId: token,
    payerId: metadata.payerId,
    payerEmail: metadata.payerEmail,
    payerName: metadata.payerName,
    payerPhone: metadata.payerPhone
  })

  return {
    success: result.success,
    transactionId: result.transactionId,
    error: result.errorMessage,
    gateway: 'payu',
    amount,
    currency,
    timestamp: new Date(),
    rawResponse: result.rawResponse
  }
}

/**
 * Procesar cobro con Wompi
 */
async function chargeWithWompi(
  paymentSourceId: string,
  amount: number,
  currency: string,
  config: GatewayConfig,
  metadata: {
    reference: string
    customerEmail: string
    customerName?: string
    customerPhone?: string
  }
): Promise<ChargeResult> {
  const wompiConfig: wompi.WompiConfig = {
    publicKey: config.publicKey || '',
    privateKey: config.privateKey || config.apiKey,
    eventsSecret: config.eventsSecret || '',
    isProduction: config.isProduction
  }

  const result = await wompi.chargeWithPaymentSource(wompiConfig, {
    amountInCents: amount * 100, // Wompi usa centavos
    currency,
    reference: metadata.reference,
    customerEmail: metadata.customerEmail,
    paymentSourceId,
    customerData: metadata.customerName ? {
      fullName: metadata.customerName,
      phoneNumber: metadata.customerPhone
    } : undefined
  })

  return {
    success: result.success,
    transactionId: result.transactionId,
    error: result.errorMessage,
    gateway: 'wompi',
    amount,
    currency,
    timestamp: new Date(),
    rawResponse: result.rawResponse
  }
}

/**
 * Procesar cobro con MercadoPago
 */
async function chargeWithMercadoPago(
  token: string,
  amount: number,
  currency: string,
  config: GatewayConfig,
  metadata: Record<string, any>
): Promise<ChargeResult> {
  // TODO: Implementar cuando se necesite MercadoPago
  return {
    success: false,
    error: 'MercadoPago no implementado aún',
    gateway: 'mercadopago',
    amount,
    currency,
    timestamp: new Date()
  }
}

/**
 * Función principal para procesar cobros
 */
export async function processCharge(
  gateway: Gateway,
  token: string,
  amount: number,
  currency: string,
  config: GatewayConfig,
  metadata: {
    referenceCode: string
    description: string
    payerId: string
    payerEmail: string
    payerName: string
    payerPhone?: string
  }
): Promise<ChargeResult> {
  switch (gateway) {
    case 'payu':
      return chargeWithPayU(token, amount, currency, config, metadata)
    case 'wompi':
      return chargeWithWompi(token, amount, currency, config, {
        reference: metadata.referenceCode,
        customerEmail: metadata.payerEmail,
        customerName: metadata.payerName,
        customerPhone: metadata.payerPhone
      })
    case 'mercadopago':
      return chargeWithMercadoPago(token, amount, currency, config, metadata)
    default:
      return {
        success: false,
        error: `Gateway no soportado: ${gateway}`,
        gateway,
        amount,
        currency,
        timestamp: new Date()
      }
  }
}

/**
 * Calcular el fee de la plataforma
 */
export function calculatePlatformFee(amount: number, feePercent: number = 2): number {
  return Math.round(amount * (feePercent / 100))
}

/**
 * Calcular próxima fecha de facturación
 */
export function calculateNextBillingDate(
  currentDate: Date,
  interval: string,
  intervalCount: number = 1
): Date {
  const date = new Date(currentDate)

  switch (interval) {
    case 'daily':
      date.setDate(date.getDate() + (1 * intervalCount))
      break
    case 'weekly':
      date.setDate(date.getDate() + (7 * intervalCount))
      break
    case 'biweekly':
      date.setDate(date.getDate() + (15 * intervalCount))
      break
    case 'monthly':
      date.setMonth(date.getMonth() + (1 * intervalCount))
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + (3 * intervalCount))
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + (1 * intervalCount))
      break
    default:
      date.setMonth(date.getMonth() + 1)
  }

  return date
}

/**
 * Generar código de referencia único
 */
export function generateReferenceCode(prefix: string = 'SUB'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}

/**
 * Job para procesar cobros pendientes (ejecutar con cron)
 */
export async function processPendingCharges(): Promise<{
  processed: number
  successful: number
  failed: number
  results: Array<{ subscriptionId: string; result: ChargeResult }>
}> {
  const now = new Date()
  const results: Array<{ subscriptionId: string; result: ChargeResult }> = []
  let successful = 0
  let failed = 0

  // Obtener suscripciones que necesitan cobro
  const { data: dueSubscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      customer:customers(*),
      plan:plans(*),
      payment_method:payment_methods(*),
      merchant:merchants(*)
    `)
    .eq('status', 'active')
    .lte('next_billing_date', now.toISOString())

  if (error || !dueSubscriptions) {
    console.error('Error fetching due subscriptions:', error)
    return { processed: 0, successful: 0, failed: 0, results: [] }
  }

  for (const subscription of dueSubscriptions) {
    const merchant = subscription.merchant
    const plan = subscription.plan
    const customer = subscription.customer
    const paymentMethod = subscription.payment_method

    if (!merchant || !plan || !customer || !paymentMethod) {
      console.error(`Missing data for subscription ${subscription.id}`)
      continue
    }

    // Construir config del gateway desde el merchant
    const gatewayConfig = merchant.gateway_config as any
    const config: GatewayConfig = {
      gateway: merchant.gateway,
      apiKey: gatewayConfig.apiKey,
      apiLogin: gatewayConfig.apiLogin,
      merchantId: gatewayConfig.merchantId,
      accountId: gatewayConfig.accountId,
      publicKey: gatewayConfig.publicKey,
      privateKey: gatewayConfig.privateKey,
      eventsSecret: gatewayConfig.eventsSecret,
      isProduction: gatewayConfig.isProduction
    }

    // Calcular fee de plataforma
    const platformFee = calculatePlatformFee(plan.price, merchant.platform_fee_percent)
    const netAmount = plan.price - platformFee

    // Crear invoice pendiente
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        merchant_id: merchant.id,
        subscription_id: subscription.id,
        customer_id: customer.id,
        amount: plan.price,
        currency: plan.currency,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'processing',
        gateway: merchant.gateway,
        billing_period_start: subscription.current_period_start,
        billing_period_end: subscription.current_period_end,
        due_date: subscription.next_billing_date
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error(`Error creating invoice for subscription ${subscription.id}:`, invoiceError)
      continue
    }

    // Procesar cobro
    const referenceCode = generateReferenceCode(`INV-${invoice.id.slice(0, 8)}`)
    const result = await processCharge(
      merchant.gateway,
      paymentMethod.token,
      plan.price,
      plan.currency,
      config,
      {
        referenceCode,
        description: `Suscripción ${plan.name} - ${merchant.name}`,
        payerId: customer.id,
        payerEmail: customer.email,
        payerName: customer.name,
        payerPhone: customer.phone
      }
    )

    results.push({ subscriptionId: subscription.id, result })

    if (result.success) {
      successful++

      // Actualizar invoice como pagado
      await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          gateway_transaction_id: result.transactionId,
          gateway_response: result.rawResponse,
          paid_at: new Date().toISOString()
        })
        .eq('id', invoice.id)

      // Actualizar suscripción: nuevo período de facturación
      const nextBillingDate = calculateNextBillingDate(
        new Date(subscription.next_billing_date),
        plan.interval,
        plan.interval_count
      )

      await supabaseAdmin
        .from('subscriptions')
        .update({
          current_period_start: subscription.next_billing_date,
          current_period_end: nextBillingDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          billing_cycle_count: subscription.billing_cycle_count + 1
        })
        .eq('id', subscription.id)

    } else {
      failed++

      // Actualizar invoice como fallido
      const nextRetry = new Date()
      nextRetry.setHours(nextRetry.getHours() + 24) // Reintentar en 24h

      await supabaseAdmin
        .from('invoices')
        .update({
          status: 'failed',
          attempt_count: invoice.attempt_count + 1,
          next_retry_at: invoice.attempt_count < 3 ? nextRetry.toISOString() : null,
          last_error: result.error,
          gateway_response: result.rawResponse
        })
        .eq('id', invoice.id)

      // Si es el 3er intento fallido, marcar suscripción como past_due
      if (invoice.attempt_count >= 2) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', subscription.id)
      }
    }
  }

  return {
    processed: dueSubscriptions.length,
    successful,
    failed,
    results
  }
}

/**
 * Cobrar a un merchant (LA REAL cobra a GRATU via Wompi)
 */
export async function chargeMerchant(merchantId: string): Promise<ChargeResult> {
  // Obtener merchant
  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single()

  if (error || !merchant) {
    return {
      success: false,
      error: 'Merchant no encontrado',
      gateway: 'wompi',
      amount: 0,
      currency: 'COP',
      timestamp: new Date()
    }
  }

  if (!merchant.wompi_token) {
    return {
      success: false,
      error: 'Merchant no tiene método de pago configurado',
      gateway: 'wompi',
      amount: 0,
      currency: 'COP',
      timestamp: new Date()
    }
  }

  // Configuración de Wompi de LA REAL
  const wompiConfig: wompi.WompiConfig = {
    publicKey: process.env.WOMPI_PUBLIC_KEY || '',
    privateKey: process.env.WOMPI_PRIVATE_KEY || '',
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || '',
    isProduction: process.env.WOMPI_IS_PRODUCTION === 'true'
  }

  const referenceCode = generateReferenceCode('PLAT')

  const result = await wompi.chargeWithPaymentSource(wompiConfig, {
    amountInCents: merchant.subscription_price * 100,
    currency: 'COP',
    reference: referenceCode,
    customerEmail: merchant.email,
    paymentSourceId: merchant.wompi_token,
    customerData: {
      fullName: merchant.name
    }
  })

  // Crear platform_invoice
  const invoiceData: any = {
    merchant_id: merchantId,
    subscription_amount: merchant.subscription_price,
    transaction_fees: 0, // TODO: calcular fees acumulados
    total_amount: merchant.subscription_price,
    currency: 'COP',
    status: result.success ? 'paid' : 'failed',
    gateway_transaction_id: result.transactionId,
    gateway_response: result.rawResponse,
    billing_period_start: new Date().toISOString().split('T')[0],
    billing_period_end: calculateNextBillingDate(new Date(), 'monthly').toISOString().split('T')[0]
  }

  if (result.success) {
    invoiceData.paid_at = new Date().toISOString()

    // Actualizar próxima fecha de cobro del merchant
    await supabaseAdmin
      .from('merchants')
      .update({
        next_platform_billing: calculateNextBillingDate(new Date(), 'monthly').toISOString().split('T')[0]
      })
      .eq('id', merchantId)
  }

  await supabaseAdmin.from('platform_invoices').insert(invoiceData)

  return {
    success: result.success,
    transactionId: result.transactionId,
    error: result.errorMessage,
    gateway: 'wompi',
    amount: merchant.subscription_price,
    currency: 'COP',
    timestamp: new Date(),
    rawResponse: result.rawResponse
  }
}
