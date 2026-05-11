import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string
) {
  const url = `${baseUrl}/reset-password?token=${token}`

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin-bottom:8px">Reset your password</h2>
        <p style="color:#555;margin-bottom:24px">
          Click the button below to reset your DevStash password.
          This link expires in 1 hour.
        </p>
        <a href="${url}"
           style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500">
          Reset Password
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
) {
  const url = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Verify your DevStash email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin-bottom:8px">Verify your email</h2>
        <p style="color:#555;margin-bottom:24px">
          Click the button below to verify your DevStash account.
          This link expires in 1 hour.
        </p>
        <a href="${url}"
           style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500">
          Verify Email
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          If you didn't create a DevStash account, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
