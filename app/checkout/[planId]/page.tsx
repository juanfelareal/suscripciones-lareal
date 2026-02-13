'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  CreditCard, 
  Lock, 
  Check, 
  Shield, 
  Calendar,
  User,
  Mail,
  Phone,
  ArrowRight,
  Loader2
} from 'lucide-react'

// Plan de ejemplo (en producción vendría de la API)
const planData = {
  'plan-basico': {
    name: 'Plan Básico',
    price: 45000,
    interval: 'mensual',
    features: ['Acceso ilimitado', 'Soporte por email', 'Actualizaciones incluidas'],
    business: 'Mi Gimnasio Fit'
  },
  'plan-pro': {
    name: 'Plan Pro',
    price: 89000,
    interval: 'mensual',
    features: ['Todo del Básico', 'Clases grupales', 'Entrenador personal', 'Nutrición'],
    business: 'Mi Gimnasio Fit'
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const planId = params.planId as string
  const plan = planData[planId as keyof typeof planData] || planData['plan-basico']

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target
    
    // Formatear número de tarjeta
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
    }
    // Formatear expiración
    if (name === 'cardExpiry') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5)
    }
    // Formatear CVC
    if (name === 'cardCvc') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }
    
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 2) {
      setStep(2)
      return
    }

    setLoading(true)
    
    // Simular procesamiento de pago
    await new Promise(r => setTimeout(r, 2500))
    
    setSuccess(true)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">¡Suscripción activa!</h1>
          <p className="text-gray-600 mb-6">
            Tu suscripción al {plan.name} ha sido procesada exitosamente.
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">Plan</span>
              <span className="font-semibold">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">Monto</span>
              <span className="font-semibold">{formatCurrency(plan.price)}/{plan.interval}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Próximo cobro</span>
              <span className="font-semibold">12 Mar 2026</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Recibirás un email de confirmación en {formData.email}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Formulario */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              {/* Progress */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                  </div>
                  <span className="font-medium">Datos</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200">
                  <div className={`h-full bg-primary transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
                </div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <span className="font-medium">Pago</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1: Datos personales */}
                {step === 1 && (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold text-dark mb-6">Tus datos</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Nombre completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Juan Pérez"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="tu@email.com"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+57 300 123 4567"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Datos de pago */}
                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold text-dark mb-6">Datos de pago</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Número de tarjeta
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Fecha de expiración
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleChange}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          CVC
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="cardCvc"
                            value={formData.cardCvc}
                            onChange={handleChange}
                            placeholder="123"
                            maxLength={4}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
                      <Shield className="w-5 h-5 text-primary" />
                      <span>Tus datos están protegidos con encriptación SSL de 256 bits</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando pago...
                    </>
                  ) : step < 2 ? (
                    <>
                      Continuar al pago
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Pagar {formatCurrency(plan.price)}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-gray-500 hover:text-dark py-3 mt-2 transition"
                  >
                    ← Volver a mis datos
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Resumen */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-dark mb-1">{plan.business}</h3>
              <p className="text-sm text-gray-500 mb-6">Te ofrece:</p>

              <div className="bg-primary/5 rounded-xl p-4 mb-6">
                <div className="text-lg font-bold text-dark">{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(plan.price)}</span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-dark">{formatCurrency(plan.price)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-dark">Total hoy</span>
                  <span className="text-primary text-lg">{formatCurrency(plan.price)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Se te cobrará {formatCurrency(plan.price)} {plan.interval}mente hasta que canceles. 
                Puedes cancelar en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
