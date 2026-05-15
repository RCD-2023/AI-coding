import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export const proxy = auth(function proxy(req) {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/items/:path*", "/collections/:path*"],
}
