"use server"

import { signIn, signOut } from "@/auth"
import { AuthError, CredentialsSignin } from "next-auth"

export type SignInState = { error: string } | undefined

export async function credentialsSignInAction(
  _state: SignInState,
  formData: FormData
): Promise<SignInState> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    })
  } catch (err) {
    if (err instanceof AuthError) {
      if (err instanceof CredentialsSignin && err.code === "email_not_verified") {
        return { error: "Please verify your email before signing in" }
      }
      return { error: "Invalid email or password" }
    }
    throw err
  }
}

export async function githubSignInAction() {
  await signIn("github", { redirectTo: "/dashboard" })
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
