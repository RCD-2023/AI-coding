---
name: Auth Architecture Patterns
description: Key auth implementation details for RCD-DEVSTASH — helps calibrate future audits and avoid re-reporting fixed issues
type: project
---

NextAuth v5 with PrismaAdapter, JWT session strategy. Two providers: Credentials (email+password) and GitHub OAuth.

Auth core split: `src/auth.config.ts` is edge-safe (returns null from authorize), `src/auth.ts` runs in Node.js and does real bcrypt validation. This is intentional and correct.

Token storage: `VerificationToken` table used for BOTH email verification tokens (identifier = email) and password reset tokens (identifier = "reset:" + email). Tokens are plain `crypto.randomBytes(32).toString("hex")` — stored as plain text (not hashed).

Profile server actions (`src/app/profile/actions.ts`): `changePassword` and `deleteAccount` both validate session via `auth()` and use `session.user.id` exclusively for DB writes.

**Why:** Documents the split-auth pattern and shared VerificationToken table usage, which are non-obvious architectural choices that affect how issues should be assessed.

**How to apply:** When auditing future auth changes, remember tokens share a single table with a naming convention (prefix "reset:") to distinguish types. Also remember the auth.config.ts / auth.ts split is intentional — do not flag auth.config.ts returning null as a bug.

Known issues identified in 2026-05-11 audit (HIGH):
1. Password reset token is deleted inside `usePasswordResetToken` BEFORE the password DB write in the route — if the write fails the user is locked out.
2. No max password length before bcrypt — DoS vector on register, reset-password, and changePassword.
