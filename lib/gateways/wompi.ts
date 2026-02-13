/**
 * Integración con Wompi Colombia
 * Documentación: https://docs.wompi.co/
 *
 * Wompi se usa para cobrar a los merchants (LA REAL cobra a GRATU)
 */

import crypto from 'crypto'

export interface WompiConfig {
  publicKey: string
  privateKey: string
  eventsSecret: string
  isProduction: boolean
}

export interface WompiTokenizeRequest {
  number: string          // Número de tarjeta
  exp_month: string       // MM
  exp_year: string        // YY
  cvc: string
  card_holder: string
}

export interface WompiTokenResponse {
  success: boolean
  tokenId?: string
  brand?: string
  lastFour?: string
  expMonth?: string
  expYear?: string
  errorMessage?: string
}

export interface WompiChargeRequest {
  amountInCents: number
  currency: string
  reference: string
  customerEmail: string
  paymentSourceId: string  // Token de la tarjeta
  customerData?: {
    fullName: string
    phoneNumber?: string
  }
}

export interface WompiChargeResponse {
  success: boolean
  transactionId?: string
  status?: string
  reference?: string
  errorMessage?: string
  rawResponse?: any
}

const SANDBOX_URL = 'https://sandbox.wompi.co/v1'
const PRODUCTION_URL = 'https://production.wompi.co/v1'

function getBaseUrl(isProduction: boolean): string {
  return isProduction ? PRODUCTION_URL : SANDBOX_URL
}

/**
 * Tokenizar tarjeta con Wompi
 * Primero se debe crear un token de aceptación, luego tokenizar
 */
export async function tokenizeCard(
  config: WompiConfig,
  cardData: WompiTokenizeRequest
): Promise<WompiTokenResponse> {
  const url = getBaseUrl(config.isProduction)

  try {
    // Paso 1: Obtener acceptance token
    const merchantResponse = await fetch(`${url}/merchants/${config.publicKey}`)
    const merchantData = await merchantResponse.json()
    const acceptanceToken = merchantData.data?.presigned_acceptance?.acceptance_token

    if (!acceptanceToken) {
      return {
        success: false,
        errorMessage: 'No se pudo obtener token de aceptación'
      }
    }

    // Paso 2: Tokenizar la tarjeta
    const tokenResponse = await fetch(`${url}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.publicKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: cardData.number.replace(/\s/g, ''),
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        cvc: cardData.cvc,
        card_holder: cardData.card_holder
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.status === 'CREATED' && tokenData.data?.id) {
      return {
        success: true,
        tokenId: tokenData.data.id,
        brand: tokenData.data.brand,
        lastFour: tokenData.data.last_four,
        expMonth: tokenData.data.exp_month,
        expYear: tokenData.data.exp_year
      }
    }

    return {
      success: false,
      errorMessage: tokenData.error?.message || 'Error al tokenizar tarjeta'
    }

  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Error de conexión con Wompi'
    }
  }
}

/**
 * Crear Payment Source (método de pago guardado) desde un token
 * Esto permite cobrar en el futuro sin volver a pedir datos
 */
export async function createPaymentSource(
  config: WompiConfig,
  tokenId: string,
  customerEmail: string,
  acceptanceToken: string
): Promise<{ success: boolean; sourceId?: string; error?: string }> {
  const url = getBaseUrl(config.isProduction)

  try {
    const response = await fetch(`${url}/payment_sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CARD',
        token: tokenId,
        customer_email: customerEmail,
        acceptance_token: acceptanceToken
      })
    })

    const data = await response.json()

    if (data.data?.id) {
      return {
        success: true,
        sourceId: data.data.id.toString()
      }
    }

    return {
      success: false,
      error: data.error?.message || 'Error al crear payment source'
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    }
  }
}

/**
 * Procesar cobro con Payment Source
 */
export async function chargeWithPaymentSource(
  config: WompiConfig,
  chargeData: WompiChargeRequest
): Promise<WompiChargeResponse> {
  const url = getBaseUrl(config.isProduction)

  try {
    const response = await fetch(`${url}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount_in_cents: chargeData.amountInCents,
        currency: chargeData.currency,
        reference: chargeData.reference,
        customer_email: chargeData.customerEmail,
        payment_source_id: parseInt(chargeData.paymentSourceId),
        customer_data: chargeData.customerData
      })
    })

    const data = await response.json()

    if (data.data?.id) {
      const status = data.data.status

      // Estados de Wompi:
      // APPROVED - Aprobado
      // PENDING - Pendiente
      // DECLINED - Rechazado
      // VOIDED - Anulado
      // ERROR - Error

      return {
        success: status === 'APPROVED',
        transactionId: data.data.id,
        status: status,
        reference: data.data.reference,
        errorMessage: status !== 'APPROVED' && status !== 'PENDING'
          ? data.data.status_message
          : undefined,
        rawResponse: data
      }
    }

    return {
      success: false,
      errorMessage: data.error?.message || 'Error al procesar el cobro',
      rawResponse: data
    }

  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Error de conexión con Wompi'
    }
  }
}

/**
 * Consultar estado de transacción
 */
export async function getTransactionStatus(
  config: WompiConfig,
  transactionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const url = getBaseUrl(config.isProduction)

  try {
    const response = await fetch(`${url}/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${config.privateKey}`
      }
    })

    const data = await response.json()

    if (data.data?.status) {
      return {
        success: true,
        status: data.data.status
      }
    }

    return {
      success: false,
      error: 'Transacción no encontrada'
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    }
  }
}

/**
 * Verificar firma de webhook
 */
export function verifyWebhookSignature(
  config: WompiConfig,
  payload: any,
  signature: string
): boolean {
  const properties = payload.signature?.properties || []
  const timestamp = payload.timestamp

  // Concatenar propiedades en orden
  let concatenatedValues = ''
  for (const prop of properties) {
    const value = getNestedProperty(payload.data, prop)
    concatenatedValues += value
  }
  concatenatedValues += timestamp
  concatenatedValues += config.eventsSecret

  // Calcular hash SHA256
  const calculatedSignature = crypto
    .createHash('sha256')
    .update(concatenatedValues)
    .digest('hex')

  return calculatedSignature === signature
}

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => {
    // Manejar arrays como transaction.id
    const match = part.match(/(\w+)\[(\d+)\]/)
    if (match) {
      return acc?.[match[1]]?.[parseInt(match[2])]
    }
    return acc?.[part]
  }, obj)
}

/**
 * Obtener acceptance token del merchant
 */
export async function getAcceptanceToken(
  config: WompiConfig
): Promise<{ success: boolean; token?: string; error?: string }> {
  const url = getBaseUrl(config.isProduction)

  try {
    const response = await fetch(`${url}/merchants/${config.publicKey}`)
    const data = await response.json()

    if (data.data?.presigned_acceptance?.acceptance_token) {
      return {
        success: true,
        token: data.data.presigned_acceptance.acceptance_token
      }
    }

    return {
      success: false,
      error: 'No se pudo obtener acceptance token'
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    }
  }
}
