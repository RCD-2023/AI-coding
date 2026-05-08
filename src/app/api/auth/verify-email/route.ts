import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { useVerificationToken } from "@/lib/db/verification-token"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url))
  }

  const result = await useVerificationToken(email, token)

  if (result === "ok") {
    return NextResponse.redirect(new URL("/verify-email?success=true", req.url))
  }

  return NextResponse.redirect(new URL(`/verify-email?error=${result}`, req.url))
}
