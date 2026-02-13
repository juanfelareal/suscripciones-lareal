'use client'

import { useState } from 'react'
import {
  BarChart3,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  MoreVertical,
  Repeat,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react'

// Datos de ejemplo para el MVP
const mockData = {
  metrics: {
    mrr: 4850000,
    mrrChange: 23,
    activeSubscribers: 127,
    subscribersChange: 12,
    churnRate: 2.1,
    churnChange: -0.3,
    ltv: 385000
  },
  recentTransactions: [
    { id: 1, customer: 'María García', email: 'maria@email.com', amount: 89000, status: 'success', date: '2026-02-12', plan: 'Pro Mensual' },
    { id: 2, customer: 'Carlos López', email: 'carlos@email.com', amount: 89000, status: 'success', date: '2026-02-12', plan: 'Pro Mensual' },
    { id: 3, customer: 'Ana Martínez', email: 'ana@email.com', amount: 45000, status: 'failed', date: '2026-02-11', plan: 'Básico' },
    { id: 4, customer: 'Juan Rodríguez', email: 'juan@email.com', amount: 89000, status: 'success', date: '2026-02-11', plan: 'Pro Mensual' },
    { id: 5, customer: 'Laura Sánchez', email: 'laura@email.com', amount: 45000, status: 'success', date: '2026-02-10', plan: 'Básico' },
  ],
  plans: [
    { id: 1, name: 'Básico', price: 45000, interval: 'monthly', subscribers: 45, active: true },
    { id: 2, name: 'Pro Mensual', price: 89000, interval: 'monthly', subscribers: 72, active: true },
    { id: 3, name: 'Pro Anual', price: 890000, interval: 'yearly', subscribers: 10, active: true },
  ]
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Repeat className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-dark">Suscripciones</div>
            <div className="text-xs text-gray-500">Mi Gimnasio Fit</div>
          </div>
        </div>

        <nav className="space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Resumen
          </button>
          <button 
            onClick={() => setActiveTab('subscribers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'subscribers' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-5 h-5" />
            Suscriptores
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'plans' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <CreditCard className="w-5 h-5" />
            Planes
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'billing' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <DollarSign className="w-5 h-5" />
            Facturación
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Settings className="w-5 h-5" />
            Configuración
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition">
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
            <p className="text-gray-500">Bienvenido de vuelta. Aquí está el resumen de tu negocio.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl font-medium transition">
            <Plus className="w-5 h-5" />
            Nuevo suscriptor
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">MRR</span>
              <div className={`flex items-center gap-1 text-sm ${mockData.metrics.mrrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mockData.metrics.mrrChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {mockData.metrics.mrrChange}%
              </div>
            </div>
            <div className="text-3xl font-bold text-dark">{formatCurrency(mockData.metrics.mrr)}</div>
            <div className="text-sm text-gray-500 mt-1">Ingresos mensuales recurrentes</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">Suscriptores</span>
              <div className={`flex items-center gap-1 text-sm ${mockData.metrics.subscribersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mockData.metrics.subscribersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {mockData.metrics.subscribersChange}%
              </div>
            </div>
            <div className="text-3xl font-bold text-dark">{mockData.metrics.activeSubscribers}</div>
            <div className="text-sm text-gray-500 mt-1">Activos este mes</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">Churn Rate</span>
              <div className={`flex items-center gap-1 text-sm ${mockData.metrics.churnChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mockData.metrics.churnChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {Math.abs(mockData.metrics.churnChange)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-dark">{mockData.metrics.churnRate}%</div>
            <div className="text-sm text-gray-500 mt-1">Tasa de cancelación</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">LTV Promedio</span>
            </div>
            <div className="text-3xl font-bold text-dark">{formatCurrency(mockData.metrics.ltv)}</div>
            <div className="text-sm text-gray-500 mt-1">Valor de vida del cliente</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark">Transacciones recientes</h2>
              <button className="text-primary text-sm font-medium hover:underline">Ver todas</button>
            </div>
            <div className="space-y-4">
              {mockData.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.status === 'success' ? (
                        <CreditCard className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-dark">{tx.customer}</div>
                      <div className="text-sm text-gray-500">{tx.plan}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${tx.status === 'success' ? 'text-dark' : 'text-red-600'}`}>
                      {tx.status === 'success' ? formatCurrency(tx.amount) : 'Fallido'}
                    </div>
                    <div className="text-sm text-gray-500">{tx.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plans Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark">Tus planes</h2>
              <button className="text-primary text-sm font-medium hover:underline">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {mockData.plans.map((plan) => (
                <div key={plan.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark">{plan.name}</span>
                    <button>
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-dark">{formatCurrency(plan.price)}</span>
                    <span className="text-sm text-gray-500">/{plan.interval === 'monthly' ? 'mes' : 'año'}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {plan.subscribers} suscriptores activos
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Próximos cobros */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-dark">Próximos cobros automáticos</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Próximos 7 días
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="text-sm text-gray-500 mb-1">Hoy</div>
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-gray-500">cobros programados</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Mañana</div>
              <div className="text-2xl font-bold text-dark">8</div>
              <div className="text-sm text-gray-500">cobros programados</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">14 Feb</div>
              <div className="text-2xl font-bold text-dark">15</div>
              <div className="text-sm text-gray-500">cobros programados</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">15 Feb</div>
              <div className="text-2xl font-bold text-dark">23</div>
              <div className="text-sm text-gray-500">cobros programados</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
