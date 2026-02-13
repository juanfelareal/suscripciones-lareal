'use client'

import { useState } from 'react'
import { 
  CreditCard, 
  Repeat, 
  BarChart3, 
  Shield, 
  Zap, 
  Users,
  Check,
  ChevronDown,
  ArrowRight,
  Building2,
  Smartphone,
  Mail
} from 'lucide-react'

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: <Repeat className="w-6 h-6" />,
      title: 'Cobros automáticos',
      description: 'Programa cobros recurrentes sin intervención manual. Quincenal, mensual o personalizado.'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Múltiples pasarelas',
      description: 'Integra PayU, Wompi o MercadoPago. Usa la pasarela que ya tienes configurada.'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Dashboard en tiempo real',
      description: 'Visualiza ingresos, suscriptores activos, churn rate y proyecciones de revenue.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '100% seguro',
      description: 'Datos tokenizados por la pasarela. Nunca almacenamos información sensible de tarjetas.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Setup en minutos',
      description: 'Conecta tu pasarela, crea planes y empieza a cobrar. Sin código, sin complicaciones.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Gestión de suscriptores',
      description: 'Pausa, cancela o modifica suscripciones. Tus clientes también pueden hacerlo.'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Conecta tu pasarela',
      description: 'Vincula tu cuenta de PayU, Wompi o MercadoPago con un par de clics.'
    },
    {
      number: '02',
      title: 'Crea tus planes',
      description: 'Define precios, frecuencias y beneficios de cada plan de suscripción.'
    },
    {
      number: '03',
      title: 'Comparte el link',
      description: 'Envía el link de pago a tus clientes. Ellos se suscriben en segundos.'
    },
    {
      number: '04',
      title: 'Cobra automático',
      description: 'Nosotros nos encargamos del resto. Tú solo ves crecer tus ingresos.'
    }
  ]

  const faqs = [
    {
      question: '¿Cómo funciona el cobro del 2%?',
      answer: 'Cobramos el 2% sobre cada transacción exitosa procesada a través de la plataforma. Si un mes no tienes cobros, no pagas nada. Solo pagas cuando vendes.'
    },
    {
      question: '¿Qué pasarelas de pago soportan?',
      answer: 'Actualmente soportamos PayU, Wompi y MercadoPago. Tú conectas tu propia cuenta de la pasarela, nosotros solo automatizamos los cobros recurrentes.'
    },
    {
      question: '¿Mis datos de tarjeta están seguros?',
      answer: 'Absolutamente. Nunca almacenamos datos de tarjetas. La tokenización la hace directamente tu pasarela de pagos (PayU, Wompi, etc.). Nosotros solo guardamos el token seguro.'
    },
    {
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Sí, sin penalidades. No hay contratos de permanencia. Si decides no continuar, simplemente dejas de usar la plataforma.'
    },
    {
      question: '¿Qué pasa si un cobro falla?',
      answer: 'El sistema reintenta automáticamente hasta 3 veces en los siguientes días. Además, envía notificaciones al cliente para que actualice su método de pago.'
    }
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-dark">Suscripciones</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-gray-600 hover:text-dark transition">Cómo funciona</a>
            <a href="#precios" className="text-gray-600 hover:text-dark transition">Precios</a>
            <a href="#faq" className="text-gray-600 hover:text-dark transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-gray-600 hover:text-dark transition hidden sm:block">Iniciar sesión</a>
            <a href="#empezar" className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-medium transition">
              Empezar gratis
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                +30 negocios ya automatizan sus cobros
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark leading-tight mb-6">
                Cobra <span className="text-primary">automáticamente</span> a tus suscriptores
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Convierte ventas irregulares en ingresos predecibles. 
                Solo pagas el 2% de lo que cobras. Si no cobras, no pagas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#empezar" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
                  Empezar ahora
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="#como-funciona" className="border-2 border-gray-200 hover:border-primary text-dark px-8 py-4 rounded-xl font-semibold text-lg transition">
                  Ver cómo funciona
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Sin contratos
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Setup en 5 min
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Soporte incluido
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-2xl p-6 shadow-xl">
                <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Ingresos del mes</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+23%</span>
                  </div>
                  <div className="text-3xl font-bold text-dark">$4.850.000</div>
                  <div className="text-sm text-gray-500">COP</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-dark">127</div>
                    <div className="text-sm text-gray-500">Suscriptores activos</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-dark">2.1%</div>
                    <div className="text-sm text-gray-500">Churn rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos pasarelas */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-500 mb-8">Integra con tu pasarela de pagos favorita</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition">
              <Building2 className="w-8 h-8" />
              <span className="font-semibold text-lg">PayU</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition">
              <CreditCard className="w-8 h-8" />
              <span className="font-semibold text-lg">Wompi</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition">
              <Smartphone className="w-8 h-8" />
              <span className="font-semibold text-lg">MercadoPago</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Todo lo que necesitas para cobrar recurrente
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sin complicaciones técnicas. Sin código. Solo conecta y empieza a cobrar.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-dark mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              De cero a cobrando en 4 pasos
            </h2>
            <p className="text-xl text-gray-600">
              Sin descargar apps. Sin configuraciones complicadas.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-primary/20 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-dark mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Simple: solo pagas cuando cobras
            </h2>
            <p className="text-xl text-gray-600">
              Sin mensualidades fijas. Sin costos ocultos. 2% por transacción exitosa.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 md:p-12 text-white text-center">
            <div className="text-6xl md:text-7xl font-bold mb-2">2%</div>
            <div className="text-xl mb-6 text-white/80">por cada transacción exitosa</div>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/80 mt-1 flex-shrink-0" />
                <span>Cobros automáticos ilimitados</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/80 mt-1 flex-shrink-0" />
                <span>Planes de suscripción ilimitados</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/80 mt-1 flex-shrink-0" />
                <span>Dashboard completo</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/80 mt-1 flex-shrink-0" />
                <span>Notificaciones por email y WhatsApp</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/80 mt-1 flex-shrink-0" />
                <span>Reintentos automáticos</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/80 mt-1 flex-shrink-0" />
                <span>Soporte prioritario</span>
              </div>
            </div>
            <a href="#empezar" className="inline-block bg-white text-primary hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition">
              Empezar gratis →
            </a>
            <p className="text-sm text-white/60 mt-4">Sin tarjeta de crédito requerida</p>
          </div>

          <div className="mt-12 bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-dark mb-6 text-center">Ejemplo con números reales</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-dark">100</div>
                <div className="text-gray-600">suscriptores</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-dark">$80.000</div>
                <div className="text-gray-600">ticket promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">$160.000</div>
                <div className="text-gray-600">costo mensual (2%)</div>
              </div>
            </div>
            <p className="text-center text-gray-500 mt-6">
              Cobras $8.000.000/mes → Pagas solo $160.000. Tú te quedas con $7.840.000.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-dark">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="empezar" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-dark rounded-3xl p-8 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Cada día sin automatizar es plata que se escapa
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              En 60 segundos puedes empezar a cobrar automáticamente.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-6 py-4 rounded-xl text-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold transition whitespace-nowrap">
                Empezar gratis
              </button>
            </form>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Garantía 30 días
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Cancela cuando quieras
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-dark">Suscripciones</span>
          </div>
          <div className="flex items-center gap-6 text-gray-600">
            <a href="#" className="hover:text-primary transition">Términos</a>
            <a href="#" className="hover:text-primary transition">Privacidad</a>
            <a href="mailto:hola@lareal.com.co" className="hover:text-primary transition flex items-center gap-2">
              <Mail className="w-4 h-4" />
              hola@lareal.com.co
            </a>
          </div>
          <div className="text-gray-500 text-sm">
            Un producto de <a href="https://lareal.com.co" className="text-primary hover:underline">La Real</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
