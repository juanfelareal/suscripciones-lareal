/**
 * Módulo de Emails para Suscripciones
 * Usa Resend para envío transaccional
 */

import { Resend } from 'resend'

// En producción: usar variable de entorno
const resend = new Resend(process.env.RESEND_API_KEY || 're_xxxxxxxxxxxxx')

export interface EmailData {
  to: string
  customerName: string
  planName?: string
  amount?: number
  nextBillingDate?: string
  businessName?: string
  businessLogo?: string
}

/**
 * Email de bienvenida cuando se activa suscripción
 */
export async function sendWelcomeEmail(data: EmailData) {
  const { to, customerName, planName, businessName } = data
  
  return resend.emails.send({
    from: `${businessName} <noreply@suscripciones.lareal.com.co>`,
    to,
    subject: `¡Bienvenido a ${planName}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">¡Hola ${customerName}! 👋</h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Tu suscripción a <strong>${planName}</strong> está activa. Ya puedes disfrutar de todos los beneficios.
            </p>
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-weight: 500;">✅ Suscripción activa</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Si tienes alguna pregunta, responde a este correo. Estamos para ayudarte.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              ${businessName} · Powered by Suscripciones La Real
            </p>
          </div>
        </body>
      </html>
    `
  })
}

/**
 * Email de confirmación de pago exitoso
 */
export async function sendPaymentSuccessEmail(data: EmailData) {
  const { to, customerName, planName, amount, nextBillingDate, businessName } = data
  
  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0)
  
  return resend.emails.send({
    from: `${businessName} <noreply@suscripciones.lareal.com.co>`,
    to,
    subject: `Pago confirmado - ${formattedAmount} ✓`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 28px;">✓</span>
              </div>
              <h1 style="color: #111827; font-size: 24px; margin: 0;">Pago confirmado</h1>
            </div>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280;">Plan</span>
                <span style="color: #111827; font-weight: 500;">${planName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280;">Monto</span>
                <span style="color: #111827; font-weight: 500;">${formattedAmount}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Próximo cobro</span>
                <span style="color: #111827; font-weight: 500;">${nextBillingDate}</span>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Gracias por tu confianza, ${customerName}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              ${businessName} · Powered by Suscripciones La Real
            </p>
          </div>
        </body>
      </html>
    `
  })
}

/**
 * Email de pago fallido
 */
export async function sendPaymentFailedEmail(data: EmailData) {
  const { to, customerName, planName, amount, businessName } = data
  
  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0)
  
  return resend.emails.send({
    from: `${businessName} <noreply@suscripciones.lareal.com.co>`,
    to,
    subject: `⚠️ Problema con tu pago - Acción requerida`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 60px; height: 60px; background: #fef2f2; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ef4444; font-size: 28px;">!</span>
              </div>
              <h1 style="color: #111827; font-size: 24px; margin: 0;">No pudimos procesar tu pago</h1>
            </div>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
              Hola ${customerName}, tuvimos un problema al cobrar <strong>${formattedAmount}</strong> de tu suscripción a ${planName}.
            </p>
            
            <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #991b1b; margin: 0; font-size: 14px;">
                <strong>¿Qué puedes hacer?</strong><br><br>
                1. Verifica que tu tarjeta tenga fondos suficientes<br>
                2. Revisa que los datos de tu tarjeta estén actualizados<br>
                3. Contacta a tu banco si el problema persiste
              </p>
            </div>
            
            <a href="#" style="display: block; background: #10b981; color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
              Actualizar método de pago
            </a>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Reintentaremos el cobro en 3 días. Si no se resuelve, tu suscripción será pausada.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              ${businessName} · Powered by Suscripciones La Real
            </p>
          </div>
        </body>
      </html>
    `
  })
}

/**
 * Email de recordatorio de renovación (3 días antes)
 */
export async function sendRenewalReminderEmail(data: EmailData) {
  const { to, customerName, planName, amount, nextBillingDate, businessName } = data
  
  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0)
  
  return resend.emails.send({
    from: `${businessName} <noreply@suscripciones.lareal.com.co>`,
    to,
    subject: `Tu suscripción se renueva pronto 📅`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Hola ${customerName} 👋</h1>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Te recordamos que tu suscripción a <strong>${planName}</strong> se renovará el <strong>${nextBillingDate}</strong>.
            </p>
            
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-size: 14px;">
                <strong>Monto a cobrar:</strong> ${formattedAmount}
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              No tienes que hacer nada. El cobro se realizará automáticamente. Si deseas cancelar o modificar tu suscripción, hazlo antes de la fecha de renovación.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              ${businessName} · Powered by Suscripciones La Real
            </p>
          </div>
        </body>
      </html>
    `
  })
}

/**
 * Email de cancelación de suscripción
 */
export async function sendCancellationEmail(data: EmailData) {
  const { to, customerName, planName, nextBillingDate, businessName } = data
  
  return resend.emails.send({
    from: `${businessName} <noreply@suscripciones.lareal.com.co>`,
    to,
    subject: `Tu suscripción ha sido cancelada`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Lamentamos verte partir 😢</h1>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Hola ${customerName}, tu suscripción a <strong>${planName}</strong> ha sido cancelada.
            </p>
            
            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Importante:</strong> Mantendrás acceso hasta el <strong>${nextBillingDate}</strong>. Después de esa fecha, tu cuenta pasará al plan gratuito.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Si cambias de opinión, siempre puedes reactivar tu suscripción.
            </p>
            
            <a href="#" style="display: block; background: #10b981; color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
              Reactivar suscripción
            </a>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              ${businessName} · Powered by Suscripciones La Real
            </p>
          </div>
        </body>
      </html>
    `
  })
}

/**
 * Tipos de emails disponibles
 */
export type EmailType = 
  | 'welcome'
  | 'payment_success' 
  | 'payment_failed'
  | 'renewal_reminder'
  | 'cancellation'

/**
 * Enviar email según tipo
 */
export async function sendEmail(type: EmailType, data: EmailData) {
  switch (type) {
    case 'welcome':
      return sendWelcomeEmail(data)
    case 'payment_success':
      return sendPaymentSuccessEmail(data)
    case 'payment_failed':
      return sendPaymentFailedEmail(data)
    case 'renewal_reminder':
      return sendRenewalReminderEmail(data)
    case 'cancellation':
      return sendCancellationEmail(data)
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}
