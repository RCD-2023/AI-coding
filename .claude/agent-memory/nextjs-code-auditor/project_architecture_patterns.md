---
name: project-architecture-patterns
description: Architectural patterns and conventions observed in rcd-devstash codebase as of 2026-05-14
metadata:
  type: project
---

Observed patterns from the full audit on 2026-05-14. These inform how to assess future issues.

**Auth:**
- Split config: `src/auth.config.ts` (edge-safe, placeholder Credentials) + `src/auth.ts` (Node.js, real bcrypt logic)
- Middleware guard intended at `src/proxy.ts` (but incorrectly named — see [[project-known-issues]])
- Per-page `auth()` calls in every layout and API route as fallback
- JWT session strategy; user.id threaded via jwt → session callbacks

**Data fetching:**
- Server components call Prisma directly (no API round-trip)
- Client components call Server Actions (`"use server"` files in `src/actions/`) or API routes
- `ItemDrawer` is the main exception — it fetches via `fetch("/api/items/[id]")` in a useEffect for progressive loading

**Ownership enforcement:**
- All item queries use `where: { id, userId }` pattern — enforced at DB query level
- Never trust client-provided userId — always read from session

**Error handling:**
- Server actions return `{ success: true, data }` or `{ success: false, error, fieldErrors? }`
- API routes return `NextResponse.json({ error }, { status })` 
- Toast notifications for user feedback (sonner)

**Input validation:**
- Zod schemas on all server action inputs
- API routes do manual field checks (not Zod)

**File storage:**
- R2 keys scoped to `userId/uuid.ext`
- `r2KeyFromUrl` strips the public URL prefix to get the key
- Upload and download both go through authenticated API routes

**Sidebar:**
- `DashboardShell` (client) wraps all dashboard/items/profile routes
- `getSidebarData` called in each layout separately (three layouts: dashboard, items, profile)
- Sidebar counts and dominant colors computed in application code from over-fetched data

**Tags:**
- Global (not per-user) — `Tag` table has `name @unique`
- `connectOrCreate` pattern on item create/update
- Update uses `set: []` then `connectOrCreate` to replace tags atomically

**Testing:**
- Vitest, tests in `src/__tests__/` mirroring src structure
- Only server actions and API routes are tested (no component tests per coding-standards)
- External deps mocked: auth, prisma, r2, aws-sdk

**Inline styles:**
- DB-driven hex colors always applied as inline `style={{ color: hex }}` or `style={{ backgroundColor: hex + "20" }}` — intentional, not a lint violation
