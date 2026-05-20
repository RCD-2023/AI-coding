import NextAuth, { CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"
import { checkRateLimit, getIp, rateLimiters } from "@/lib/rate-limit"

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified"
}

class RateLimitError extends CredentialsSignin {
  code = "rate_limit"
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    redirect: async ({ baseUrl }) => `${baseUrl}/dashboard`,
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isPro: true },
        })
        token.isPro = dbUser?.isPro ?? false
      }

      return token
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string
      session.user.isPro = token.isPro as boolean
      return session
    },
  },
  ...authConfig,
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const { email, password } = credentials as {
          email: string
          password: string
        }
        const ip = getIp(request as Request)
        const rl = await checkRateLimit(rateLimiters.login, `login:${ip}:${email}`)
        if (!rl.success) throw new RateLimitError()

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.password) return null
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null
        if (process.env.SKIP_EMAIL_VERIFICATION !== "true" && !user.emailVerified) {
          throw new EmailNotVerifiedError()
        }
        return user
      },
    }),
  ],
})
