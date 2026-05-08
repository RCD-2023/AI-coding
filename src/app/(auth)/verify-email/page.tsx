import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Email verified
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account is now active. You can sign in.
          </p>
          <Link href="/sign-in" className={cn(buttonVariants(), "w-full")}>
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const message =
    error === "expired"
      ? "This verification link has expired."
      : "This verification link is invalid."

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Verification failed
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Create a new account
        </Link>
      </div>
    </div>
  )
}
