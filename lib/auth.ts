import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Buscar usuario en la base de datos
        const { data: user, error } = await supabaseAdmin
          .from('merchant_users')
          .select(`
            id,
            email,
            password_hash,
            name,
            role,
            is_active,
            merchant:merchants(
              id,
              name,
              slug,
              gateway,
              subscription_status
            )
          `)
          .eq('email', email)
          .eq('is_active', true)
          .single()

        if (error || !user) {
          console.log('User not found:', email)
          return null
        }

        // Verificar contraseña
        const isValid = await bcrypt.compare(password, user.password_hash)

        if (!isValid) {
          console.log('Invalid password for:', email)
          return null
        }

        // Actualizar último login
        await supabaseAdmin
          .from('merchant_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          merchantId: (user.merchant as any)?.id,
          merchantName: (user.merchant as any)?.name,
          merchantSlug: (user.merchant as any)?.slug,
          gateway: (user.merchant as any)?.gateway
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.merchantId = (user as any).merchantId
        token.merchantName = (user as any).merchantName
        token.merchantSlug = (user as any).merchantSlug
        token.gateway = (user as any).gateway
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).merchantId = token.merchantId
        ;(session.user as any).merchantName = token.merchantName
        ;(session.user as any).merchantSlug = token.merchantSlug
        ;(session.user as any).gateway = token.gateway
      }
      return session
    }
  }
})

// Helper para hashear contraseñas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Helper para verificar contraseñas
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
