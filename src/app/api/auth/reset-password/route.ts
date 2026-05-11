import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { usePasswordResetToken } from "@/lib/db/verification-token"

export async function POST(req: Request) {
  const { token, password, confirmPassword } = await req.json()

  if (!token || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    )
  }

  const result = await usePasswordResetToken(token)

  if (result === "invalid") {
    return NextResponse.json(
      { error: "Invalid or expired reset link" },
      { status: 400 }
    )
  }

  if (result === "expired") {
    return NextResponse.json(
      { error: "This reset link has expired. Request a new one." },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { email: result.email },
    data: { password: hashed },
  })

  return NextResponse.json({ message: "Password reset successfully" }, { status: 200 })
}
