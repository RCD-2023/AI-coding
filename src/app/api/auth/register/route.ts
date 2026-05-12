import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createVerificationToken } from "@/lib/db/verification-token"
import { sendVerificationEmail } from "@/lib/email"
import { checkRateLimit, getIp, rateLimiters, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = getIp(req)
  const rl = await checkRateLimit(rateLimiters.register, `register:${ip}`)
  if (!rl.success) return rateLimitResponse(rl.reset)

  const { name, email, password, confirmPassword } = await req.json()

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed },
  })

  if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
    return NextResponse.json({ message: "User created successfully", skipVerification: true }, { status: 201 })
  }

  const token = await createVerificationToken(email)
  const baseUrl = new URL(req.url).origin
  await sendVerificationEmail(email, token, baseUrl)

  return NextResponse.json({ message: "User created successfully", skipVerification: false }, { status: 201 })
}
