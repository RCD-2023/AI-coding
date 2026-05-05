# Current Feature

<!-- Feature Name -->

## Seed Sample Data

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

- [x] Add `password` field to User schema (nullable, for credentials auth)
- [x] Run migration for schema change
- [x] Overwrite `prisma/seed.ts` with full sample data:
  - [x] System ItemTypes (7 built-in types)
  - [x] Demo user: demo@devstash.io / 12345678 (bcryptjs, 12 rounds)
  - [x] 5 collections with items: React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources
- [ ] Build passes

## Notes

- Seed is destructive for the demo user — deletes and recreates on each run
- System ItemTypes use upsert (idempotent, safe to re-run)
- bcryptjs used for password hashing (not bcrypt — no native bindings needed)

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial Next.js setup with TypeScript and Tailwind CSS: configured CLAUDE.md, added context files, removed default Next.js SVGs, committed to main
- Dashboard UI Phase 1: ShadCN UI setup, dark mode by default, /dashboard route with top bar (logo, search, buttons) and sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar (PanelLeft toggle on desktop, Sheet drawer on mobile), types nav with colored icons linking to /items/[type]s, favorite and all collections with collapsible Collections section, user avatar area at bottom
- Dashboard UI Phase 3: Main content area with 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type-colored accent borders, pinned items section, 10 most recent items section
- Database Setup: Prisma 7 + Neon PostgreSQL — full schema (User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models), initial migration, system ItemTypes seeded, PrismaPg driver adapter singleton, scripts/test-db.ts for connection testing