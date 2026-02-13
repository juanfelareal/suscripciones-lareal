'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  AlertCircle,
  Calendar
} from 'lucide-react'

interface Metrics {
  mrr: number
  activeSubscribers: number
  churnRate: number
  ltv: number
  pendingCharges: number
  failedCharges: number
}

interface Transaction {
  id: string
  customer_name: string
  customer_email: string
  amount: number
  status: string
  created_at: string
  plan_name: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.merchantId) {
      fetchDashboardData()
    }
  }, [user?.merchantId])

  async function fetchDashboardData() {
    try {
      const res = await fetch(`/api/admin/dashboard?merchantId=${user.merchantId}`)
      const data = await res.json()

      if (data.success) {
        setMetrics(data.metrics)
        setTransactions(data.recentTransactions || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
        <p className="text-gray-500">
          Bienvenido, {user?.name}. Aquí está el resumen de {user?.merchantName}.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">MRR</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold text-dark">
            {formatCurrency(metrics?.mrr || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Ingresos mensuales recurrentes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">Suscriptores</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold text-dark">
            {metrics?.activeSubscribers || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Activos</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">Churn Rate</span>
            <TrendingDown className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-dark">
            {metrics?.churnRate || 0}%
          </div>
          <div className="text-sm text-gray-500 mt-1">Tasa de cancelación</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">LTV Promedio</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold text-dark">
            {formatCurrency(metrics?.ltv || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Valor de vida</div>
        </div>
      </div>

      {/* Alerts */}
      {(metrics?.failedCharges || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">
            Tienes {metrics?.failedCharges} cobros fallidos que requieren atención
          </span>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark">Transacciones recientes</h2>
          <a href="/admin/transacciones" className="text-primary text-sm font-medium hover:underline">
            Ver todas
          </a>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay transacciones aún
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.status === 'paid' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.status === 'paid' ? (
                      <CreditCard className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-dark">{tx.customer_name}</div>
                    <div className="text-sm text-gray-500">{tx.plan_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    tx.status === 'paid' ? 'text-dark' : 'text-red-600'
                  }`}>
                    {tx.status === 'paid' ? formatCurrency(tx.amount) : 'Fallido'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString('es-CO')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
