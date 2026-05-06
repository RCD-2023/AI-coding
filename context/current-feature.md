# Current Feature

Code Audit Quick Wins

## Status

In Progress

## Goals

Address the low-risk, no-schema-change findings from the full code audit:

1. **Delete `src/lib/mock-data.ts`** — entirely unused dead code, no imports anywhere in `src/`
2. **Extract shared `iconMap`** — the same 7-icon map is copy-pasted verbatim in `SidebarContent.tsx`, `CollectionCard.tsx`, and `ItemCard.tsx`; extract to `src/lib/icon-map.ts` and import from there
3. **Centralize `DEMO_USER_EMAIL`** — `"demo@devstash.io"` is hardcoded in `collections.ts`, `items.ts`, and `sidebar.ts`; move to a single constant so the auth swap is a one-line change
4. **Move `PRO_TYPES` to module scope** — defined inside `getItemTypesForSidebar()` on every call; move to a module-level constant in `sidebar.ts`
5. **Cap sidebar recents** — non-favorite collections are pushed with no limit; add `SIDEBAR_RECENT_LIMIT = 5` and slice before returning
6. **Exclude pinned items from recent items query** — `fetchItems` for `recent` has no `isPinned: false` filter, so pinned items appear in both "Pinned" and "Recent Items" sections
7. **Add `DATABASE_URL` startup guard in `prisma.ts`** — replace the `!` non-null assertion with an explicit check that throws a clear error message if the var is missing

## Notes

- No schema changes, no new dependencies, no architectural changes
- Items 1–4 are pure refactors with zero behavior change
- Items 5–6 are small query/data fixes
- Item 7 is a dev-experience improvement only

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
