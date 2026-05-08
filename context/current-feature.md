# Current Feature: Email Verification on Register

## Status

In Progress

## Goals

- After a user registers, send a verification email via Resend using `onboarding@resend.dev` as the from address
- The email contains a unique verification link the user must click to verify their account
- Unverified users are blocked from accessing protected routes until they verify
- Clicking the link marks the user as verified in the database
- Provide appropriate UI feedback: prompt to check email after register, error if token is invalid/expired, success message after verification

## Notes

- Use Resend SDK (RESEND_API_KEY already in .env)
- From email: `onboarding@resend.dev`
- Need to add `emailVerified` and a verification token + expiry to the User model (or a separate VerificationToken table — NextAuth already has one we can reuse)
- Token should expire (e.g., 1 hour)
- Protect /dashboard/* so unverified users are redirected to a "check your email" page
- GitHub OAuth users can be considered auto-verified (they already have a verified email)

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial Next.js setup with TypeScript and Tailwind CSS: configured CLAUDE.md, added context files, removed default Next.js SVGs, committed to main
- Dashboard UI Phase 1: ShadCN UI setup, dark mode by default, /dashboard route with top bar (logo, search, buttons) and sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar (PanelLeft toggle on desktop, Sheet drawer on mobile), types nav with colored icons linking to /items/[type]s, favorite and all collections with collapsible Collections section, user avatar area at bottom
- Dashboard UI Phase 3: Main content area with 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type-colored accent borders, pinned items section, 10 most recent items section
- Database Setup: Prisma 7 + Neon PostgreSQL -- full schema (User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models), initial migration, system ItemTypes seeded, PrismaPg driver adapter singleton, scripts/test-db.ts for connection testing
- Seed Sample Data: added password field to User, demo user (demo@devstash.io / bcryptjs), 5 collections with 18 items (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources)
- Dashboard Collections -- Real Data: replaced mock collections with Neon DB data, created src/lib/db/collections.ts (getCollectionsForUser, getStatsForUser, getDashboardData), dominant type color and type icons derived per collection, all 4 stats cards use real counts, demo user hardcoded until auth is wired up
- Dashboard Items -- Real Data: replaced mock pinned and recent items with Neon DB data, created src/lib/db/items.ts (fetchItems, getDashboardItems), ItemCard updated to use pre-resolved itemType (name, icon, color), type badge added, no mock-data dependency remaining in dashboard
- Stats & Sidebar -- Real Data: created src/lib/db/sidebar.ts (getSidebarData, item types with counts, favorites and recents with dominant color and item count), dashboard layout fetches and passes sidebar data as props, SidebarContent fully replaced mock data with real DB data -- item types with icons/counts, favorites with colored star + count, recents with colored dot + count, "View All Collections" button linking to /collections, seed updated with isFavorite=true on React Patterns and AI Workflows
- Add Pro Badge to Sidebar: added ShadCN outline Badge to File and Image item type links in the sidebar, isPro flag derived in the data layer (sidebar.ts) via a Set of pro type names, badge is subtle with muted foreground color
- Code Audit Quick Wins: extracted shared iconMap to src/lib/icon-map.ts, centralized DEMO_USER_EMAIL to src/lib/constants.ts, moved PRO_TYPES and SIDEBAR_RECENT_LIMIT to module scope, capped sidebar recents at 5, excluded pinned items from recent query, added DATABASE_URL startup guard, added 5 composite DB indexes (userId+isFavorite/isPinned/createdAt on Item, userId+isFavorite/updatedAt on Collection)
- Auth Setup: NextAuth v5 with GitHub OAuth provider, split config pattern for edge compatibility (auth.config.ts + auth.ts), Prisma adapter, JWT strategy, proxy-based route protection for /dashboard/*, NextAuth models wired to DB via migration, environment variables AUTH_SECRET/AUTH_GITHUB_ID/AUTH_GITHUB_SECRET
- Auth Credentials: Credentials provider (email/password) added alongside GitHub OAuth using split config pattern, POST /api/auth/register endpoint with field validation, duplicate email check, bcrypt hashing, and user creation
- Auth UI: custom /sign-in page (credentials + GitHub OAuth, useActionState error handling), custom /register page (all fields, success toast via Sonner), server actions for sign-in/sign-out, reusable UserAvatar component (GitHub image or initials), sidebar user area replaced with real session data and sign-out dropdown, getSidebarData accepts userId (demo user hardcode removed)
