import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-load clients para evitar errores en build
let _supabaseAdmin: SupabaseClient | null = null
let _supabase: SupabaseClient | null = null

// Cliente para operaciones del servidor (con service_role)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!url || !key) {
        throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos')
      }

      _supabaseAdmin = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    return (_supabaseAdmin as any)[prop]
  }
})

// Cliente para operaciones públicas (con anon key)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_ANON_KEY

      if (!url || !key) {
        throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY son requeridos')
      }

      _supabase = createClient(url, key)
    }
    return (_supabase as any)[prop]
  }
})

// Tipos de la base de datos
export interface Merchant {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  gateway: 'payu' | 'wompi' | 'mercadopago'
  gateway_config: {
    apiKey: string
    apiLogin?: string
    merchantId: string
    accountId?: string
    isProduction: boolean
  }
  platform_fee_percent: number
  subscription_status: 'active' | 'past_due' | 'cancelled' | 'trial'
  subscription_plan: string
  subscription_price: number
  next_platform_billing?: string
  wompi_token?: string
  logo_url?: string
  website?: string
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  merchant_id: string
  name: string
  description?: string
  price: number
  currency: string
  interval: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  interval_count: number
  features: string[]
  trial_days: number
  is_active: boolean
  is_public: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  merchant_id: string
  email: string
  name: string
  phone?: string
  document_type?: string
  document_number?: string
  default_payment_method_id?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  customer_id: string
  merchant_id: string
  gateway: string
  token: string
  card_last_four?: string
  card_brand?: string
  card_exp_month?: string
  card_exp_year?: string
  cardholder_name?: string
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  merchant_id: string
  customer_id: string
  plan_id: string
  payment_method_id?: string
  status: 'active' | 'past_due' | 'paused' | 'cancelled' | 'trialing'
  current_period_start: string
  current_period_end: string
  next_billing_date: string
  trial_end?: string
  cancel_at_period_end: boolean
  cancelled_at?: string
  cancellation_reason?: string
  billing_cycle_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  merchant_id: string
  subscription_id: string
  customer_id: string
  invoice_number?: string
  amount: number
  currency: string
  platform_fee: number
  net_amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'void'
  gateway?: string
  gateway_transaction_id?: string
  gateway_response?: Record<string, any>
  paid_at?: string
  due_date?: string
  attempt_count: number
  next_retry_at?: string
  last_error?: string
  billing_period_start?: string
  billing_period_end?: string
  created_at: string
  updated_at: string
}
