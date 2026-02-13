import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Usuarios de ejemplo (en producción: base de datos)
const users = [
  {
    id: '1',
    email: 'demo@lareal.com.co',
    password: 'demo123', // En producción: hash con bcrypt
    name: 'Mi Gimnasio Fit',
    businessName: 'Gimnasio Fitness Center',
    plan: 'pro'
  }
]

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

        const user = users.find(u => u.email === credentials.email)
        
        if (!user || user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          businessName: user.businessName
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.businessName = (user as any).businessName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).businessName = token.businessName
      }
      return session
    }
  }
})
