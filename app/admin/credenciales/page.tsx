'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  ExternalLink
} from 'lucide-react'

interface GatewayConfig {
  apiKey: string
  apiLogin: string
  merchantId: string
  accountId: string
  isProduction: boolean
}

export default function CredencialesPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [config, setConfig] = useState<GatewayConfig>({
    apiKey: '',
    apiLogin: '',
    merchantId: '',
    accountId: '',
    isProduction: false
  })
  const [showSecrets, setShowSecrets] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasConfig, setHasConfig] = useState(false)

  useEffect(() => {
    if (user?.merchantId) {
      fetchConfig()
    }
  }, [user?.merchantId])

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/admin/credentials?merchantId=${user.merchantId}`)
      const data = await res.json()

      if (data.success && data.config) {
        setConfig({
          apiKey: data.config.apiKey || '',
          apiLogin: data.config.apiLogin || '',
          merchantId: data.config.merchantId || '',
          accountId: data.config.accountId || '',
          isProduction: data.config.isProduction || false
        })
        setHasConfig(!!data.config.apiKey)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user.merchantId,
          config
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Credenciales guardadas correctamente' })
        setHasConfig(true)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSaving(false)
    }
  }

  const gateway = user?.gateway || 'payu'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Credenciales de Pago</h1>
        <p className="text-gray-500">
          Configura tus credenciales de {gateway === 'payu' ? 'PayU' : gateway === 'wompi' ? 'Wompi' : 'MercadoPago'} para procesar cobros.
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
        hasConfig ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        {hasConfig ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">Credenciales configuradas</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-700">Credenciales pendientes de configurar</span>
          </>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-blue-700 text-sm font-medium">Tus credenciales están seguras</p>
          <p className="text-blue-600 text-sm mt-1">
            Las credenciales se almacenan encriptadas y nunca se muestran completas después de guardarlas.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
            <Key className="w-5 h-5" />
            {gateway === 'payu' ? 'PayU Latam' : gateway === 'wompi' ? 'Wompi' : 'MercadoPago'}
          </h2>
          <button
            type="button"
            onClick={() => setShowSecrets(!showSecrets)}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
          >
            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSecrets ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <div className="space-y-5">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              API Key
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Tu API Key de PayU"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              required
            />
          </div>

          {/* API Login */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              API Login
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={config.apiLogin}
              onChange={(e) => setConfig({ ...config, apiLogin: e.target.value })}
              placeholder="Tu API Login de PayU"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              required
            />
          </div>

          {/* Merchant ID */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Merchant ID
            </label>
            <input
              type="text"
              value={config.merchantId}
              onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
              placeholder="Tu Merchant ID"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              required
            />
          </div>

          {/* Account ID */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Account ID
            </label>
            <input
              type="text"
              value={config.accountId}
              onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
              placeholder="Tu Account ID"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              required
            />
          </div>

          {/* Production Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-medium text-dark">Modo Producción</div>
              <div className="text-sm text-gray-500">
                Activa esto cuando estés listo para cobrar de verdad
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isProduction}
                onChange={(e) => setConfig({ ...config, isProduction: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Credenciales
            </>
          )}
        </button>
      </form>

      {/* Help Link */}
      <div className="mt-6 text-center">
        <a
          href="https://developers.payulatam.com/latam/es/docs/getting-started.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm inline-flex items-center gap-1"
        >
          ¿Cómo obtener mis credenciales de PayU?
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
