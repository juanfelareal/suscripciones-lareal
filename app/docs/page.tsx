'use client'

import { useState } from 'react'
import { 
  Repeat, 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  ChevronRight,
  Webhook,
  Key,
  CreditCard,
  Settings
} from 'lucide-react'

export default function DocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const codeExamples = {
    registerToken: `// Después de tokenizar en tu pasarela (PayU, Wompi, etc.)
// envía el token a nuestra API para activar cobros recurrentes

const response = await fetch('https://api.suscripciones.lareal.com.co/v1/tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'tu_api_key_aqui'
  },
  body: JSON.stringify({
    customer: {
      email: 'cliente@email.com',
      name: 'Juan Pérez',
      phone: '+573001234567'
    },
    paymentToken: 'tok_xxxxxxxxxxxxxxxx', // Token de tu pasarela
    gateway: 'payu', // payu | wompi | mercadopago
    planId: 'plan_mensual_pro',
    cardInfo: {
      lastFour: '4242',
      brand: 'visa',
      expiryMonth: '12',
      expiryYear: '2028'
    }
  })
});

const { data } = await response.json();
console.log(data.subscriptionId); // sub_xxxxx`,

    webhook: `// Configura tu endpoint para recibir eventos
// POST https://tudominio.com/webhooks/suscripciones

app.post('/webhooks/suscripciones', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment.success':
      // Cobro exitoso
      console.log('Pago recibido:', event.data.amount);
      // Actualizar acceso del usuario
      break;
      
    case 'payment.failed':
      // Cobro fallido
      console.log('Pago fallido:', event.data.error);
      // Notificar al usuario, reintentar, etc.
      break;
      
    case 'subscription.cancelled':
      // Suscripción cancelada
      console.log('Suscripción cancelada:', event.data.subscriptionId);
      // Revocar acceso
      break;
  }
  
  res.status(200).json({ received: true });
});`,

    cancelSubscription: `// Cancelar una suscripción
const response = await fetch('https://api.suscripciones.lareal.com.co/v1/subscriptions/sub_xxxxx', {
  method: 'DELETE',
  headers: {
    'x-api-key': 'tu_api_key_aqui'
  }
});

// La suscripción se cancela al final del período actual
// El cliente mantiene acceso hasta esa fecha`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-dark text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl">Suscripciones</span>
          </a>
          <nav className="flex items-center gap-3 md:gap-6 text-sm md:text-base">
            <a href="/dashboard" className="text-gray-300 hover:text-white transition">Dashboard</a>
            <a href="/docs" className="text-white font-medium">Docs</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-dark text-white py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Documentación de la API</h1>
          <p className="text-base md:text-xl text-gray-300 max-w-2xl">
            Integra cobros recurrentes a tu checkout existente en minutos. 
            Funciona con PayU, Wompi y MercadoPago.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-1">
            <nav className="sticky top-6 space-y-1">
              <a href="#quickstart" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                <Terminal className="w-4 h-4" />
                Quick Start
              </a>
              <a href="#autenticacion" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition">
                <Key className="w-4 h-4" />
                Autenticación
              </a>
              <a href="#registrar-token" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition">
                <CreditCard className="w-4 h-4" />
                Registrar Token
              </a>
              <a href="#webhooks" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition">
                <Webhook className="w-4 h-4" />
                Webhooks
              </a>
              <a href="#gestionar" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition">
                <Settings className="w-4 h-4" />
                Gestionar Suscripciones
              </a>
            </nav>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Quick Start */}
            <section id="quickstart">
              <h2 className="text-2xl font-bold text-dark mb-4">Quick Start</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-600 mb-6">
                  Integra cobros recurrentes en 3 pasos:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold text-dark">Obtén tu API Key</h3>
                      <p className="text-gray-600">Ve al Dashboard → Configuración → API Keys</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold text-dark">Tokeniza en tu pasarela</h3>
                      <p className="text-gray-600">Usa el SDK de PayU/Wompi/MP en tu checkout para tokenizar la tarjeta del cliente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold text-dark">Envía el token a nuestra API</h3>
                      <p className="text-gray-600">Nosotros nos encargamos de los cobros recurrentes automáticos</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Autenticación */}
            <section id="autenticacion">
              <h2 className="text-2xl font-bold text-dark mb-4">Autenticación</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-600 mb-4">
                  Todas las peticiones deben incluir tu API Key en el header:
                </p>
                <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-gray-300">
                  <span className="text-blue-400">x-api-key:</span> tu-api-key-aqui
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Nunca expongas tu API Key en código del lado del cliente. 
                    Usa siempre llamadas desde tu servidor.
                  </p>
                </div>
              </div>
            </section>

            {/* Registrar Token */}
            <section id="registrar-token">
              <h2 className="text-2xl font-bold text-dark mb-4">Registrar Token</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-mono">POST</span>
                  <span className="font-mono text-gray-600">/api/v1/tokens</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Después de que tu checkout tokenice la tarjeta en la pasarela, 
                  envía el token para activar cobros recurrentes:
                </p>
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(codeExamples.registerToken, 0)}
                    className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    {copiedIndex === 0 ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <pre className="bg-gray-900 rounded-xl p-3 md:p-4 font-mono text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap break-words md:whitespace-pre md:break-normal">
                    {codeExamples.registerToken}
                  </pre>
                </div>
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks">
              <h2 className="text-2xl font-bold text-dark mb-4">Webhooks</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-600 mb-6">
                  Configura un endpoint para recibir notificaciones de eventos en tiempo real:
                </p>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-dark mb-3">Eventos disponibles:</h3>
                  <div className="grid gap-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                      <code className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs md:text-sm w-fit">payment.success</code>
                      <span className="text-gray-600 text-sm">Cobro procesado exitosamente</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                      <code className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs md:text-sm w-fit">payment.failed</code>
                      <span className="text-gray-600 text-sm">Cobro fallido (reintento programado)</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                      <code className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs md:text-sm w-fit">subscription.cancelled</code>
                      <span className="text-gray-600 text-sm">Suscripción cancelada</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                      <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs md:text-sm w-fit">subscription.paused</code>
                      <span className="text-gray-600 text-sm">Suscripción pausada</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(codeExamples.webhook, 1)}
                    className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    {copiedIndex === 1 ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <pre className="bg-gray-900 rounded-xl p-3 md:p-4 font-mono text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap break-words md:whitespace-pre md:break-normal">
                    {codeExamples.webhook}
                  </pre>
                </div>
              </div>
            </section>

            {/* Gestionar */}
            <section id="gestionar">
              <h2 className="text-2xl font-bold text-dark mb-4">Gestionar Suscripciones</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-600 mb-6">
                  Cancela, pausa o modifica suscripciones programáticamente:
                </p>
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(codeExamples.cancelSubscription, 2)}
                    className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    {copiedIndex === 2 ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <pre className="bg-gray-900 rounded-xl p-3 md:p-4 font-mono text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap break-words md:whitespace-pre md:break-normal">
                    {codeExamples.cancelSubscription}
                  </pre>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-primary rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">¿Necesitas ayuda?</h2>
              <p className="text-white/80 mb-6">
                Nuestro equipo está listo para ayudarte con la integración
              </p>
              <a href="mailto:dev@lareal.com.co" className="inline-block bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition">
                Contactar soporte técnico
              </a>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
