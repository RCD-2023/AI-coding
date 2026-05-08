import Link from "next/link"
import { Mail } from "lucide-react"

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          We sent a verification link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email address"
          )}
          . Click the link to activate your account.
        </p>
        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
