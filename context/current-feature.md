# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial Next.js setup with TypeScript and Tailwind CSS: configured CLAUDE.md, added context files, removed default Next.js SVGs, committed to main
- Dashboard UI Phase 1: ShadCN UI setup, dark mode by default, /dashboard route with top bar (logo, search, buttons) and sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar (PanelLeft toggle on desktop, Sheet drawer on mobile), types nav with colored icons linking to /items/[type]s, favorite and all collections with collapsible Collections section, user avatar area at bottom
- Dashboard UI Phase 3: Main content area with 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type-colored accent borders, pinned items section, 10 most recent items section
- Database Setup: Prisma 7 + Neon PostgreSQL — full schema (User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models), initial migration, system ItemTypes seeded, PrismaPg driver adapter singleton, scripts/test-db.ts for connection testing