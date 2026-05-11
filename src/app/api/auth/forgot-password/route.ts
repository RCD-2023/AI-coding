import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPasswordResetToken } from "@/lib/db/verification-token"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = await createPasswordResetToken(email)
    const baseUrl = new URL(req.url).origin
    await sendPasswordResetEmail(email, token, baseUrl)
  }

  return NextResponse.json(
    { message: "If this email is registered, you will receive a reset link." },
    { status: 200 }
  )
}
