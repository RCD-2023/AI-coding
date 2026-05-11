import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function createPasswordResetToken(email: string) {
  const identifier = `reset:${email}`
  await prisma.verificationToken.deleteMany({ where: { identifier } })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  })

  return token
}

export async function usePasswordResetToken(
  token: string
): Promise<"invalid" | "expired" | { email: string }> {
  const record = await prisma.verificationToken.findFirst({
    where: { token },
  })

  if (!record || !record.identifier.startsWith("reset:")) return "invalid"

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    })
    return "expired"
  }

  const email = record.identifier.slice("reset:".length)

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  })

  return { email }
}

export async function createVerificationToken(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  return token
}

export async function useVerificationToken(email: string, token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  })

  if (!record) return "invalid" as const

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    })
    return "expired" as const
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
  ])

  return "ok" as const
}
