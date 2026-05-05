# Current Feature

<!-- Feature Name -->

## Prisma + Neon PostgreSQL Setup

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

- Install and configure Prisma 7 (has breaking changes — read upgrade guide before writing any code)
- Connect to Neon PostgreSQL (serverless) via `DATABASE_URL` pointing to dev branch
- Write full schema based on data models in `project-overview.md`
- Include NextAuth v5 required models: `Account`, `Session`, `VerificationToken`
- Add appropriate indexes and cascade deletes
- Run first migration with `prisma migrate dev --name init` (never `db push`)
- Seed system `ItemType` records (Snippet, Prompt, Command, Note, Link, File, Image)

## Notes

- Migration policy: always use `prisma migrate dev`, never `prisma db push` or hand-edit schema
- Dev DB = `DATABASE_URL` (Neon dev branch); production will use a separate Neon branch
- Prisma 7 has breaking changes — consult the upgrade guide at https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7 before implementation
- Setup guide reference: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial Next.js setup with TypeScript and Tailwind CSS: configured CLAUDE.md, added context files, removed default Next.js SVGs, committed to main
- Dashboard UI Phase 1: ShadCN UI setup, dark mode by default, /dashboard route with top bar (logo, search, buttons) and sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar (PanelLeft toggle on desktop, Sheet drawer on mobile), types nav with colored icons linking to /items/[type]s, favorite and all collections with collapsible Collections section, user avatar area at bottom
- Dashboard UI Phase 3: Main content area with 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type-colored accent borders, pinned items section, 10 most recent items section