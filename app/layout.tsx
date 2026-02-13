import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suscripciones - Cobra automáticamente a tus clientes',
  description: 'Plataforma de cobros recurrentes para negocios colombianos. Automatiza tus suscripciones con PayU, Wompi y MercadoPago.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
