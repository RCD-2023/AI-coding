import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth(function proxy(req) {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url))
  }
})

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
}
