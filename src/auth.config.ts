import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export default {
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // Edge-safe placeholder — real validation runs in auth.ts (Node.js only)
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig
