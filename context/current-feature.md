# Current Feature

<!-- Feature Name -->

## Stats & Sidebar

## Status

<!-- Not Started|In Progress|Completed -->

Completed

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