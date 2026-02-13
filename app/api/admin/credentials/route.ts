import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET - Obtener configuración de credenciales del merchant
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
    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .select('gateway_config, gateway')
      .eq('id', merchantId)
      .single()

    if (error || !merchant) {
      return NextResponse.json({ success: false, error: 'Merchant no encontrado' }, { status: 404 })
    }

    // Ocultar parcialmente las credenciales sensibles
    const config = merchant.gateway_config as any
    const maskedConfig = {
      apiKey: config?.apiKey ? maskSecret(config.apiKey) : '',
      apiLogin: config?.apiLogin ? maskSecret(config.apiLogin) : '',
      merchantId: config?.merchantId || '',
      accountId: config?.accountId || '',
      isProduction: config?.isProduction || false
    }

    return NextResponse.json({
      success: true,
      gateway: merchant.gateway,
      config: maskedConfig,
      hasCredentials: !!config?.apiKey
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener configuración'
    }, { status: 500 })
  }
}

/**
 * POST - Guardar configuración de credenciales
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { merchantId, config } = body

    if (!merchantId || !config) {
      return NextResponse.json({
        success: false,
        error: 'merchantId y config son requeridos'
      }, { status: 400 })
    }

    // Verificar que el usuario pertenece al merchant
    const user = session.user as any
    if (user.merchantId !== merchantId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    // Validar campos requeridos
    if (!config.apiKey || !config.apiLogin || !config.merchantId || !config.accountId) {
      return NextResponse.json({
        success: false,
        error: 'Todos los campos son requeridos'
      }, { status: 400 })
    }

    // Obtener config actual para no perder datos si envían masked
    const { data: currentMerchant } = await supabaseAdmin
      .from('merchants')
      .select('gateway_config')
      .eq('id', merchantId)
      .single()

    const currentConfig = currentMerchant?.gateway_config as any || {}

    // Si el valor está masked, mantener el original
    const newConfig = {
      apiKey: isMasked(config.apiKey) ? currentConfig.apiKey : config.apiKey,
      apiLogin: isMasked(config.apiLogin) ? currentConfig.apiLogin : config.apiLogin,
      merchantId: config.merchantId,
      accountId: config.accountId,
      isProduction: config.isProduction
    }

    // Actualizar en la base de datos
    const { error } = await supabaseAdmin
      .from('merchants')
      .update({ gateway_config: newConfig })
      .eq('id', merchantId)

    if (error) {
      console.error('Error updating credentials:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al guardar credenciales'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales guardadas correctamente'
    })

  } catch (error) {
    console.error('Credentials error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    }, { status: 500 })
  }
}

function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return '••••••••'
  return secret.slice(0, 4) + '••••••••' + secret.slice(-4)
}

function isMasked(value: string): boolean {
  return value.includes('••••')
}
