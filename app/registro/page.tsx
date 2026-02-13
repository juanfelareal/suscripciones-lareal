'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repeat, Mail, Lock, User, Building2, ArrowRight, Check } from 'lucide-react'

export default function RegistroPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    gateway: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGatewaySelect = (gateway: string) => {
    setFormData({ ...formData, gateway })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }
    
    setLoading(true)
    // Simular registro
    await new Promise(r => setTimeout(r, 1500))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Repeat className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl text-dark">Suscripciones</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition ${
                s <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Datos personales */}
            {step === 1 && (
              <>
                <h1 className="text-2xl font-bold text-dark text-center mb-2">
                  Crea tu cuenta
                </h1>
                <p className="text-gray-500 text-center mb-8">
                  Empieza a cobrar automáticamente en minutos
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Tu nombre
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
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Datos del negocio */}
            {step === 2 && (
              <>
                <h1 className="text-2xl font-bold text-dark text-center mb-2">
                  Cuéntanos de tu negocio
                </h1>
                <p className="text-gray-500 text-center mb-8">
                  Esto nos ayuda a personalizar tu experiencia
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Nombre del negocio
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Mi Empresa SAS"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-4">
                      ¿Qué tipo de negocio tienes?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Gimnasio/Fitness', 'SaaS/Software', 'Membresías', 'E-commerce', 'Educación', 'Otro'].map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          className="p-3 border border-gray-200 rounded-xl text-sm hover:border-primary hover:bg-primary/5 transition"
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Pasarela de pagos */}
            {step === 3 && (
              <>
                <h1 className="text-2xl font-bold text-dark text-center mb-2">
                  Conecta tu pasarela
                </h1>
                <p className="text-gray-500 text-center mb-8">
                  Selecciona la pasarela que ya usas en tu negocio
                </p>

                <div className="space-y-4">
                  {[
                    { id: 'payu', name: 'PayU', desc: 'La más usada en Colombia' },
                    { id: 'wompi', name: 'Wompi', desc: 'De Bancolombia' },
                    { id: 'mercadopago', name: 'MercadoPago', desc: 'Popular en Latam' }
                  ].map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => handleGatewaySelect(gw.id)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition flex items-center justify-between ${
                        formData.gateway === gw.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-dark">{gw.name}</div>
                        <div className="text-sm text-gray-500">{gw.desc}</div>
                      </div>
                      {formData.gateway === gw.id && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleGatewaySelect('later')}
                    className={`w-full p-4 border-2 rounded-xl text-center transition ${
                      formData.gateway === 'later'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-gray-600">Configurar después</span>
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (step === 3 && !formData.gateway)}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
            >
              {loading ? (
                'Creando cuenta...'
              ) : step < 3 ? (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Crear mi cuenta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full text-gray-500 hover:text-dark py-3 mt-2 transition"
            >
              ← Volver
            </button>
          )}

          {step === 1 && (
            <p className="text-center text-gray-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-primary font-medium hover:underline">
                Iniciar sesión
              </a>
            </p>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Al crear tu cuenta aceptas los{' '}
          <a href="#" className="text-primary hover:underline">términos y condiciones</a>
        </p>
      </div>
    </div>
  )
}
