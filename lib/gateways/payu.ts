/**
 * Integración con PayU Latam
 * Documentación: https://developers.payulatam.com/latam/es/docs/integrations/api-integration/tokenization-api.html
 */

import crypto from 'crypto'

export interface PayUConfig {
  apiKey: string
  apiLogin: string
  merchantId: string
  accountId: string
  isProduction: boolean
}

export interface PayUTokenizeRequest {
  payerId: string
  name: string
  identificationNumber: string
  paymentMethod: string // VISA, MASTERCARD, AMEX, etc.
  number: string        // Número de tarjeta
  expirationDate: string // YYYY/MM
}

export interface PayUTokenResponse {
  success: boolean
  creditCardTokenId?: string
  maskedNumber?: string
  errorMessage?: string
}

export interface PayUChargeRequest {
  referenceCode: string
  description: string
  amount: number
  currency: string
  creditCardTokenId: string
  payerId: string
  payerEmail: string
  payerName: string
  payerPhone?: string
}

export interface PayUChargeResponse {
  success: boolean
  transactionId?: string
  orderId?: string
  state?: string
  responseCode?: string
  errorMessage?: string
  rawResponse?: any
}

const SANDBOX_URL = 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi'
const PRODUCTION_URL = 'https://api.payulatam.com/payments-api/4.0/service.cgi'

function getBaseUrl(isProduction: boolean): string {
  return isProduction ? PRODUCTION_URL : SANDBOX_URL
}

function generateSignature(apiKey: string, merchantId: string, referenceCode: string, amount: number, currency: string): string {
  const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

/**
 * Tokenizar una tarjeta de crédito
 * Crea un token que permite cobrar sin volver a pedir datos de tarjeta
 */
export async function tokenizeCard(
  config: PayUConfig,
  cardData: PayUTokenizeRequest
): Promise<PayUTokenResponse> {
  const url = getBaseUrl(config.isProduction)

  const payload = {
    language: 'es',
    command: 'CREATE_TOKEN',
    merchant: {
      apiLogin: config.apiLogin,
      apiKey: config.apiKey
    },
    creditCardToken: {
      payerId: cardData.payerId,
      name: cardData.name,
      identificationNumber: cardData.identificationNumber,
      paymentMethod: cardData.paymentMethod,
      number: cardData.number,
      expirationDate: cardData.expirationDate
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.code === 'SUCCESS' && data.creditCardToken) {
      return {
        success: true,
        creditCardTokenId: data.creditCardToken.creditCardTokenId,
        maskedNumber: data.creditCardToken.maskedNumber
      }
    }

    return {
      success: false,
      errorMessage: data.error || 'Error al tokenizar la tarjeta'
    }

  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Error de conexión con PayU'
    }
  }
}

/**
 * Procesar cobro con token (sin CVV)
 * Requiere tener habilitado processWithoutCvv2 en la cuenta de PayU
 */
export async function chargeWithToken(
  config: PayUConfig,
  chargeData: PayUChargeRequest
): Promise<PayUChargeResponse> {
  const url = getBaseUrl(config.isProduction)

  const signature = generateSignature(
    config.apiKey,
    config.merchantId,
    chargeData.referenceCode,
    chargeData.amount,
    chargeData.currency
  )

  const payload = {
    language: 'es',
    command: 'SUBMIT_TRANSACTION',
    merchant: {
      apiLogin: config.apiLogin,
      apiKey: config.apiKey
    },
    transaction: {
      order: {
        accountId: config.accountId,
        referenceCode: chargeData.referenceCode,
        description: chargeData.description,
        language: 'es',
        signature: signature,
        additionalValues: {
          TX_VALUE: {
            value: chargeData.amount,
            currency: chargeData.currency
          }
        },
        buyer: {
          merchantBuyerId: chargeData.payerId,
          fullName: chargeData.payerName,
          emailAddress: chargeData.payerEmail,
          contactPhone: chargeData.payerPhone || '',
          shippingAddress: {
            country: 'CO'
          }
        }
      },
      payer: {
        merchantPayerId: chargeData.payerId,
        fullName: chargeData.payerName,
        emailAddress: chargeData.payerEmail,
        contactPhone: chargeData.payerPhone || ''
      },
      creditCardTokenId: chargeData.creditCardTokenId,
      creditCard: {
        processWithoutCvv2: true  // Cobrar sin CVV (requiere permiso de PayU)
      },
      type: 'AUTHORIZATION_AND_CAPTURE',
      paymentMethod: 'VISA', // Se detecta del token
      paymentCountry: 'CO',
      ipAddress: '127.0.0.1',
      userAgent: 'Suscripciones LA REAL'
    },
    test: !config.isProduction
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.code === 'SUCCESS' && data.transactionResponse) {
      const txResponse = data.transactionResponse

      // Estados de PayU:
      // APPROVED - Aprobado
      // PENDING - Pendiente (puede ser por validación adicional)
      // DECLINED - Rechazado
      // ERROR - Error en la transacción

      const isApproved = txResponse.state === 'APPROVED'
      const isPending = txResponse.state === 'PENDING'

      return {
        success: isApproved,
        transactionId: txResponse.transactionId,
        orderId: txResponse.orderId?.toString(),
        state: txResponse.state,
        responseCode: txResponse.responseCode,
        errorMessage: !isApproved && !isPending ? txResponse.responseMessage : undefined,
        rawResponse: data
      }
    }

    return {
      success: false,
      errorMessage: data.error || 'Error al procesar el cobro',
      rawResponse: data
    }

  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Error de conexión con PayU'
    }
  }
}

/**
 * Consultar estado de una transacción
 */
export async function getTransactionStatus(
  config: PayUConfig,
  orderId: string
): Promise<{ success: boolean; state?: string; error?: string }> {
  const url = getBaseUrl(config.isProduction)

  const payload = {
    language: 'es',
    command: 'ORDER_DETAIL',
    merchant: {
      apiLogin: config.apiLogin,
      apiKey: config.apiKey
    },
    details: {
      orderId: orderId
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.code === 'SUCCESS' && data.result) {
      return {
        success: true,
        state: data.result.payload?.transactions?.[0]?.transactionResponse?.state
      }
    }

    return {
      success: false,
      error: data.error || 'Error al consultar transacción'
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    }
  }
}

/**
 * Eliminar un token de tarjeta
 */
export async function deleteToken(
  config: PayUConfig,
  payerId: string,
  creditCardTokenId: string
): Promise<{ success: boolean; error?: string }> {
  const url = getBaseUrl(config.isProduction)

  const payload = {
    language: 'es',
    command: 'REMOVE_TOKEN',
    merchant: {
      apiLogin: config.apiLogin,
      apiKey: config.apiKey
    },
    removeCreditCardToken: {
      payerId: payerId,
      creditCardTokenId: creditCardTokenId
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    return {
      success: data.code === 'SUCCESS',
      error: data.code !== 'SUCCESS' ? data.error : undefined
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    }
  }
}

/**
 * Detectar marca de tarjeta por número
 */
export function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, '')

  if (/^4/.test(number)) return 'VISA'
  if (/^5[1-5]/.test(number)) return 'MASTERCARD'
  if (/^3[47]/.test(number)) return 'AMEX'
  if (/^6(?:011|5)/.test(number)) return 'DISCOVER'
  if (/^(?:2131|1800|35\d{3})/.test(number)) return 'JCB'
  if (/^3(?:0[0-5]|[68])/.test(number)) return 'DINERS'

  return 'VISA' // Default
}
