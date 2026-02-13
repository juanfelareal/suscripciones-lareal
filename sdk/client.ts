/**
 * SDK Cliente para Suscripciones LA REAL
 *
 * Uso en Tranki:
 *
 * import { SuscripcionesClient } from '@/lib/suscripciones-client'
 *
 * const suscripciones = new SuscripcionesClient({
 *   merchantSlug: 'gratu',
 *   baseUrl: 'https://suscripciones.lareal.co'
 * })
 *
 * // Verificar si un usuario tiene suscripción
 * const status = await suscripciones.getSubscriptionStatus('usuario@email.com')
 * if (status.hasSubscription && status.isActive) {
 *   // Usuario es Pro
 * }
 *
 * // Crear suscripción
 * const result = await suscripciones.subscribe({
 *   planId: 'uuid-del-plan',
 *   customer: { email: '...', name: '...' },
 *   card: { number: '...', ... }
 * })
 */

export interface SuscripcionesConfig {
  merchantSlug: string
  baseUrl: string
  apiKey?: string
}

export interface CustomerData {
  email: string
  name: string
  phone?: string
  documentType?: string
  documentNumber?: string
}

export interface CardData {
  number: string
  expMonth: string
  expYear: string
  cvv: string
  holderName?: string
}

export interface SubscribeRequest {
  planId: string
  customer: CustomerData
  card: CardData
}

export interface Plan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  features: string[]
  trialDays: number
}

export interface SubscriptionStatus {
  hasSubscription: boolean
  isActive: boolean
  isTrial: boolean
  isPastDue: boolean
  subscription?: {
    id: string
    status: string
    plan: Plan
    currentPeriodEnd: string
    trialEnd?: string
    cancelAtPeriodEnd: boolean
    billingCycleCount: number
  }
}

export interface SubscribeResult {
  success: boolean
  error?: string
  data?: {
    subscriptionId: string
    customerId: string
    status: string
    plan: {
      name: string
      price: number
      currency: string
      interval: string
    }
    trialEndsAt?: string
    nextBillingDate: string
    paymentMethod: {
      brand: string
      lastFour: string
    }
  }
}

export class SuscripcionesClient {
  private config: SuscripcionesConfig

  constructor(config: SuscripcionesConfig) {
    this.config = config
  }

  private get baseApiUrl(): string {
    return `${this.config.baseUrl}/api/v1/merchants/${this.config.merchantSlug}`
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey
    }

    return headers
  }

  /**
   * Obtener planes disponibles
   */
  async getPlans(): Promise<{ success: boolean; plans?: Plan[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseApiUrl}/subscribe`, {
        headers: this.getHeaders()
      })

      const data = await response.json()

      if (data.success) {
        return { success: true, plans: data.data.plans }
      }

      return { success: false, error: data.error }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Verificar estado de suscripción de un usuario
   */
  async getSubscriptionStatus(email: string): Promise<SubscriptionStatus> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/customers/${encodeURIComponent(email)}/subscription`,
        { headers: this.getHeaders() }
      )

      const data = await response.json()

      if (data.success) {
        return data.data
      }

      return {
        hasSubscription: false,
        isActive: false,
        isTrial: false,
        isPastDue: false
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return {
        hasSubscription: false,
        isActive: false,
        isTrial: false,
        isPastDue: false
      }
    }
  }

  /**
   * Crear una nueva suscripción
   */
  async subscribe(request: SubscribeRequest): Promise<SubscribeResult> {
    try {
      const response = await fetch(`${this.baseApiUrl}/subscribe`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      })

      const data = await response.json()

      return {
        success: data.success,
        error: data.error,
        data: data.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Cancelar suscripción (al final del período)
   */
  async cancelSubscription(
    subscriptionId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ action: 'cancel', reason })
        }
      )

      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Cancelar suscripción inmediatamente
   */
  async cancelSubscriptionImmediately(
    subscriptionId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ action: 'cancel_immediately', reason })
        }
      )

      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Pausar suscripción
   */
  async pauseSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ action: 'pause' })
        }
      )

      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Reanudar suscripción pausada
   */
  async resumeSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ action: 'resume' })
        }
      )

      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Obtener detalles de una suscripción
   */
  async getSubscription(subscriptionId: string): Promise<{
    success: boolean
    subscription?: any
    error?: string
  }> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/subscriptions/${subscriptionId}`,
        { headers: this.getHeaders() }
      )

      const data = await response.json()

      if (data.success) {
        return { success: true, subscription: data.data }
      }

      return { success: false, error: data.error }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }
}

// Export default para uso más simple
export default SuscripcionesClient
