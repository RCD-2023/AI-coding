# Auth Security Review

**Last Audit**: 2026-05-11  
**Auditor**: auth-auditor agent  
**Scope**: NextAuth v5 credentials + GitHub provider, email verification, password reset, profile page

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 2 |
| MEDIUM   | 2 |
| LOW      | 1 |

Overall assessment: The auth implementation is structurally sound with no critical exploits — bcrypt is used correctly, sessions are properly validated, and tokens are cryptographically strong — but two real-world failure scenarios (password reset token invalidated before the DB write succeeds, and no upper bound on password length before bcrypt) warrant prompt fixes.

---

## Findings

### [HIGH] — Password Reset Token Deleted Before Password Is Saved

**File**: `src/app/api/auth/reset-password/route.ts` (line 24) / `src/lib/db/verification-token.ts` (lines 36–41)  
**Description**: `usePasswordResetToken` deletes the reset token from the database and then returns the user's email. The caller (`reset-password/route.ts`) only performs the `bcrypt.hash` + `prisma.user.update` **after** the token is already gone. If the bcrypt call throws (e.g. OOM), if the database write fails (transient connectivity loss, constraint violation), or if the process is killed mid-request, the token has been permanently consumed but the user's password was never changed. The user is now locked out — their old password still works but they cannot reset again without going through the forgot-password flow a second time, which only works if they notice the failure. Under load or with a flaky database connection this scenario is realistic, not theoretical.

**Evidence**:
```ts
// src/lib/db/verification-token.ts — token deleted at line 36 before returning
await prisma.verificationToken.delete({          // line 36-39 — token gone here
  where: { identifier_token: { identifier: record.identifier, token } },
})
return { email }                                 // line 41 — caller gets email now

// src/app/api/auth/reset-password/route.ts
const result = await usePasswordResetToken(token) // token deleted inside this call
// ... error checks ...
const hashed = await bcrypt.hash(password, 10)    // line 40 — only runs after token is gone
await prisma.user.update({                         // line 41-44 — if this throws, user is locked out
  where: { email: result.email },
  data: { password: hashed },
})
```

**Fix**: Move token deletion to after the password update succeeds. The cleanest approach is to wrap both operations in a Prisma transaction, or return the token record from `usePasswordResetToken` without deleting it and let the route delete it only after the update commits:

```ts
// Option A — transaction in the route (preferred)
const record = await validatePasswordResetToken(token) // validates + returns record, does NOT delete
if (!record) { ... }

await prisma.$transaction([
  prisma.user.update({ where: { email: record.email }, data: { password: hashed } }),
  prisma.verificationToken.delete({ where: { identifier_token: { ... } } }),
])
```

---

### [HIGH] — No Maximum Password Length Before bcrypt (DoS Vector)

**File**: `src/app/api/auth/register/route.ts` (line 23), `src/app/api/auth/reset-password/route.ts` (line 40), `src/app/profile/actions.ts` (line 39)  
**Description**: bcrypt has a hard internal limit of 72 bytes. A password longer than 72 bytes is silently truncated — this is a known correctness issue but not exploitable here because it is consistent across hash and compare. The real concern is a **computational DoS**: bcrypt with cost 10 is intentionally slow. A single request containing a multi-megabyte password string causes the server to spend CPU time bcrypt-hashing it. Without a max-length guard, an attacker can submit arbitrarily large strings to the register, reset-password, or change-password endpoints and block the event loop on that thread for seconds per request. There is no rate limiting on these routes (see the separate finding), which makes this more impactful.

**Evidence**:
```ts
// src/app/api/auth/register/route.ts — no length check before hashing
const hashed = await bcrypt.hash(password, 10)   // line 23

// src/app/api/auth/reset-password/route.ts — only a minimum check, no maximum
if (password.length < 8) { ... }                 // line 17 — no upper bound
const hashed = await bcrypt.hash(password, 10)   // line 40

// src/app/profile/actions.ts
if (newPassword.length < 8) { ... }              // line 22 — no upper bound
const hashed = await bcrypt.hash(newPassword, 12) // line 39
```

**Fix**: Add a maximum password length check (72 or 128 characters is a common choice) before any bcrypt call:

```ts
if (password.length > 128) {
  return NextResponse.json({ error: "Password must be 128 characters or fewer" }, { status: 400 })
}
```

Apply the same guard in `src/app/profile/actions.ts` before the `bcrypt.hash` call.

---

### [MEDIUM] — No Rate Limiting on Authentication Endpoints

**Files**: `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/auth.ts` (credentials `authorize` callback)  
**Description**: None of the auth API routes implement any form of rate limiting (IP-based, token-bucket, sliding window, or otherwise). This exposes three concrete risks:

1. **Credential stuffing / brute-force** on the sign-in flow — an attacker can try unlimited email/password combinations against the credentials provider.
2. **Email bombing** on `/api/auth/forgot-password` — no limit prevents an attacker from sending hundreds of reset emails to any registered address per minute, which is both an abuse vector and a cost problem (Resend charges per email).
3. **Registration spam** on `/api/auth/register` — repeated account creation from the same IP.

The project overview acknowledges rate limiting as an open question for AI endpoints; the same consideration applies to auth endpoints.

**Fix**: Add rate limiting middleware. A straightforward approach using `@upstash/ratelimit` + Upstash Redis (or an in-memory store for development):

```ts
// Example for forgot-password route
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 min per IP
})

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous"
  const { success } = await ratelimit.limit(ip)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  // ...
}
```

For the credentials provider, the same check can be applied in the `authorize` callback in `src/auth.ts`.

---

### [MEDIUM] — Reset and Verification Tokens Stored as Plain Text

**File**: `src/lib/db/verification-token.ts` (lines 8, 46)  
**Description**: Both `createPasswordResetToken` and `createVerificationToken` store the raw token value directly in the `verificationToken` table. If the database is compromised (SQL injection elsewhere in the app, a leaked backup, a misconfigured connection string, etc.), an attacker gains immediate access to all outstanding reset and email-verification tokens. A password reset token is functionally equivalent to a temporary credential — using it lets an attacker set a new password and fully take over the account. The token's 1-hour TTL limits the window but does not eliminate the risk.

**Evidence**:
```ts
// createPasswordResetToken — raw token written to DB
const token = crypto.randomBytes(32).toString("hex")  // line 8
await prisma.verificationToken.create({
  data: { identifier, token, expires },               // line 11-13 — plain text
})

// createVerificationToken — same pattern
const token = crypto.randomBytes(32).toString("hex")  // line 46
await prisma.verificationToken.create({
  data: { identifier: email, token, expires },        // line 49-51 — plain text
})
```

**Fix**: Store a SHA-256 hash of the token in the database; send the plain token to the user. On verification, hash the incoming token and compare against the stored hash. SHA-256 is appropriate here (not bcrypt) because the token already has 256 bits of entropy from `crypto.randomBytes(32)`:

```ts
import { createHash } from "crypto"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

// On create: store hashToken(token), send token to user
// On use: query by hashToken(incomingToken)
```

---

### [LOW] — Inconsistent bcrypt Cost Factor Across Password Hashing Calls

**Files**: `src/app/api/auth/register/route.ts` (line 23), `src/app/api/auth/reset-password/route.ts` (line 40), `src/app/profile/actions.ts` (line 39)  
**Description**: Registration and password reset use `bcrypt.hash(password, 10)` while `changePassword` in the profile actions uses `bcrypt.hash(newPassword, 12)`. Cost 10 and 12 are both acceptable security values, but the inconsistency means passwords set via registration or reset are weaker than those set via change-password, and it signals the cost factor was chosen ad-hoc rather than from a shared constant. This is a maintainability concern that could become a real issue if someone lowers a value elsewhere in the future.

**Evidence**:
```ts
// register/route.ts line 23
const hashed = await bcrypt.hash(password, 10)

// reset-password/route.ts line 40
const hashed = await bcrypt.hash(password, 10)

// profile/actions.ts line 39
const hashed = await bcrypt.hash(newPassword, 12)
```

**Fix**: Define a single constant in a shared config file and reference it everywhere:

```ts
// src/lib/auth-config.ts
export const BCRYPT_ROUNDS = 12
```

Then replace all three hardcoded values with `BCRYPT_ROUNDS`. Decide on 12 as the standard (it is already used in the most sensitive path — changing your own password — and is the higher of the two values).

---

## Passed Checks

**Password hashing algorithm**: bcrypt via `bcryptjs` is used at all three password-hashing sites — `src/app/api/auth/register/route.ts` line 23, `src/app/api/auth/reset-password/route.ts` line 40, `src/app/profile/actions.ts` line 39. No weak algorithm (MD5, SHA-1, SHA-256 without bcrypt) is present anywhere. Passwords are never logged or stored in plain text.

**`await` on bcrypt calls**: All three `bcrypt.hash` calls and both `bcrypt.compare` calls (`src/auth.ts` line 42 and `src/app/profile/actions.ts` line 36) are correctly awaited. No missing-await bug that would cause incorrect password comparison.

**Email verification token generation**: `crypto.randomBytes(32).toString("hex")` at `src/lib/db/verification-token.ts` line 46. This provides 256 bits of cryptographically random entropy — sufficient by any standard.

**Password reset token generation**: `crypto.randomBytes(32).toString("hex")` at `src/lib/db/verification-token.ts` line 8. Same entropy as above.

**Token expiration**: Both token types are created with a 1-hour expiry (`new Date(Date.now() + 60 * 60 * 1000)`). The expiry is checked before use in both `useVerificationToken` (line 63) and `usePasswordResetToken` (line 27). Expired tokens are deleted on encounter.

**Email verification token — single-use enforcement with atomicity**: `useVerificationToken` wraps the `user.update` (setting `emailVerified`) and the token deletion in a `prisma.$transaction` (line 70–78 of `src/lib/db/verification-token.ts`), ensuring both succeed or both fail atomically. A token cannot be consumed without the user being marked as verified, and the user cannot be marked as verified without consuming the token.

**Session validation in server actions**: `src/app/profile/actions.ts` calls `auth()` at the top of both `changePassword` (line 12) and `deleteAccount` (line 49) and immediately returns/redirects if no session is found. All database writes use `session.user.id` from the validated session — no user-supplied ID is trusted.

**Insecure Direct Object Reference prevention on profile**: Both `changePassword` and `deleteAccount` look up and modify records using `session.user.id` exclusively (lines 29, 41, 52 in `src/app/profile/actions.ts`). A user cannot modify another user's account.

**Re-verification of current password before change**: `changePassword` fetches the user's stored hash and calls `bcrypt.compare(currentPassword, user.password)` (line 36) before hashing or saving the new password. A session alone is insufficient — the caller must prove knowledge of the current password.

**Profile page auth guard**: `src/app/profile/page.tsx` line 13 checks `session?.user?.id` and redirects to `/sign-in` if absent. The layout (`src/app/profile/layout.tsx`) does not need its own guard because the page enforces it; data fetching in the layout uses a safe fallback (`userId ? await getSidebarData(userId) : null`).

**Forgot-password user enumeration prevention**: `src/app/api/auth/forgot-password/route.ts` returns the same response message and 200 status whether the email is registered or not (lines 21–24). The actual token creation and email send are inside the `if (user)` block (lines 15–18) but the response is unconditional. This is the correct pattern.

**No sensitive data in error messages**: `src/actions/auth.ts` returns only "Invalid email or password" or "Please verify your email before signing in" — no stack traces, user IDs, or internal details. Profile action errors are similarly generic.

**Email in verification URL is encoded**: `src/lib/email.ts` line 40 uses `encodeURIComponent(email)` when constructing the verification link, preventing injection via specially crafted email addresses.

**Credentials provider edge pattern**: `src/auth.config.ts` is edge-safe (returns `null` from `authorize`) while the real validation runs in `src/auth.ts` in the Node.js runtime. This is the correct Next.js v5 + Edge Middleware pattern and is not a security issue.

---

## What NextAuth Handles (Not Audited)

- **CSRF protection** — built into NextAuth v5 form action and API handler processing
- **Session cookie security** — `httpOnly`, `secure`, `sameSite` flags managed by NextAuth
- **OAuth state parameter** — generated and validated by NextAuth on every GitHub OAuth flow
- **JWT signing and verification** — signed with `AUTH_SECRET`; not manually handled
- **Session invalidation on sign-out** — cookie clearing handled by `signOut()`
- **GitHub OAuth token exchange** — full code → access token exchange handled by NextAuth's GitHub provider
- **OAuth account linking** — managed by PrismaAdapter
