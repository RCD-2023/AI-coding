# Current Feature

## Status

Not Started

## Goals

<!-- Add goals here -->

## Notes

<!-- Add notes here -->

## History

<!-- Keep this updated. Earliest to latest -->

1. Project setup and boilerplate cleanup
2. Initial Next.js setup with TypeScript and Tailwind CSS: configured CLAUDE.md, added context files, removed default Next.js SVGs, committed to main
3. Dashboard UI Phase 1: ShadCN UI setup, dark mode by default, /dashboard route with top bar (logo, search, buttons) and sidebar/main placeholders
4. Dashboard UI Phase 2: Collapsible sidebar (PanelLeft toggle on desktop, Sheet drawer on mobile), types nav with colored icons linking to /items/[type]s, favorite and all collections with collapsible Collections section, user avatar area at bottom
5. Dashboard UI Phase 3: Main content area with 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type-colored accent borders, pinned items section, 10 most recent items section
6. Database Setup: Prisma 7 + Neon PostgreSQL -- full schema (User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models), initial migration, system ItemTypes seeded, PrismaPg driver adapter singleton, scripts/test-db.ts for connection testing
7. Seed Sample Data: added password field to User, demo user (demo@devstash.io / bcryptjs), 5 collections with 18 items (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources)
8. Dashboard Collections -- Real Data: replaced mock collections with Neon DB data, created src/lib/db/collections.ts (getCollectionsForUser, getStatsForUser, getDashboardData), dominant type color and type icons derived per collection, all 4 stats cards use real counts, demo user hardcoded until auth is wired up
9. Dashboard Items -- Real Data: replaced mock pinned and recent items with Neon DB data, created src/lib/db/items.ts (fetchItems, getDashboardItems), ItemCard updated to use pre-resolved itemType (name, icon, color), type badge added, no mock-data dependency remaining in dashboard
10. Stats & Sidebar -- Real Data: created src/lib/db/sidebar.ts (getSidebarData, item types with counts, favorites and recents with dominant color and item count), dashboard layout fetches and passes sidebar data as props, SidebarContent fully replaced mock data with real DB data -- item types with icons/counts, favorites with colored star + count, recents with colored dot + count, "View All Collections" button linking to /collections, seed updated with isFavorite=true on React Patterns and AI Workflows
11. Add Pro Badge to Sidebar: added ShadCN outline Badge to File and Image item type links in the sidebar, isPro flag derived in the data layer (sidebar.ts) via a Set of pro type names, badge is subtle with muted foreground color
12. Code Audit Quick Wins: extracted shared iconMap to src/lib/icon-map.ts, centralized DEMO_USER_EMAIL to src/lib/constants.ts, moved PRO_TYPES and SIDEBAR_RECENT_LIMIT to module scope, capped sidebar recents at 5, excluded pinned items from recent query, added DATABASE_URL startup guard, added 5 composite DB indexes (userId+isFavorite/isPinned/createdAt on Item, userId+isFavorite/updatedAt on Collection)
13. Auth Setup: NextAuth v5 with GitHub OAuth provider, split config pattern for edge compatibility (auth.config.ts + auth.ts), Prisma adapter, JWT strategy, proxy-based route protection for /dashboard/*, NextAuth models wired to DB via migration, environment variables AUTH_SECRET/AUTH_GITHUB_ID/AUTH_GITHUB_SECRET
14. Auth Credentials: Credentials provider (email/password) added alongside GitHub OAuth using split config pattern, POST /api/auth/register endpoint with field validation, duplicate email check, bcrypt hashing, and user creation
15. Auth UI: custom /sign-in page (credentials + GitHub OAuth, useActionState error handling), custom /register page (all fields, success toast via Sonner), server actions for sign-in/sign-out, reusable UserAvatar component (GitHub image or initials), sidebar user area replaced with real session data and sign-out dropdown, getSidebarData accepts userId (demo user hardcode removed)
16. Auth Email Verification: Resend email sent on register (onboarding@resend.dev), VerificationToken table used for 1-hour expiry tokens, GET /api/auth/verify-email validates and marks emailVerified, credentials sign-in blocked for unverified users with specific error, /check-email and /verify-email UI pages, scripts/purge-test-users.ts utility
17. Email Verification Toggle: SKIP_EMAIL_VERIFICATION env var (set to "true" to bypass), register route skips token/email and returns skipVerification flag, RegisterForm redirects to /sign-in instead of /check-email when skipped, credentials sign-in skips emailVerified guard when flag is set
18. Auth Route Protection Fix: proxy.ts was importing from @/auth (Prisma, Node.js-only) causing silent failure in edge runtime -- fixed to use edge-safe NextAuth(authConfig) split, /dashboard/:path* now correctly redirects unauthenticated users to /sign-in
19. Forgot Password: "Forgot password?" link on sign-in page, /forgot-password page (email form, sends Resend email), /reset-password page (token + new password form), createPasswordResetToken/usePasswordResetToken in verification-token.ts using reset:{email} identifier prefix to avoid collision with email verification tokens, always returns 200 on forgot-password to prevent email enumeration
20. Profile Page: /profile route (auth-protected) with DashboardShell layout, user info card (avatar, name, email, member since), usage stats (total items, total collections, per-type breakdown with colored icons), Change Password dialog (credentials users only), Delete Account dialog with confirmation, Profile link added to sidebar user dropdown
21. Rate Limiting for Auth: Upstash Redis sliding window limits on register (3/hr, IP), forgot-password (3/hr, IP), reset-password (5/15min, IP), and credentials login (5/15min, IP+email via authorize); reusable src/lib/rate-limit.ts with getIp/checkRateLimit/rateLimitResponse; 429 + Retry-After header; fail-open when Upstash unavailable; RateLimitError surfaced through NextAuth CredentialsSignin to sign-in action
22. Items List View: dynamic route /items/[type] with DashboardShell layout, getItemsByTypeSlug resolves slug (e.g. "snippets") to ItemType, responsive 2-col ItemCard grid, auth-protected via proxy; also fixed getDashboardData/getDashboardItems to use session userId instead of hardcoded demo user, making all data session-scoped
