# RCD-DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all developer knowledge & resources.**

DevStash unifies the scattered places developers keep their essentials — code snippets, AI prompts, terminal commands, context files, links, and notes — into a single searchable workspace with first-class support for AI-powered workflows.

---

## Table of Contents

1. [Problem](#1-problem)
2. [Target Users](#2-target-users)
3. [Feature Overview](#3-feature-overview)
4. [Data Model (Rough Draft)](#4-data-model-rough-draft)
5. [System Architecture](#5-system-architecture)
6. [Tech Stack](#6-tech-stack)
7. [Monetization](#7-monetization)
8. [UI/UX Guidelines](#8-uiux-guidelines)
9. [Type System Reference](#9-type-system-reference)
10. [Open Questions / TBD](#10-open-questions--tbd)

---

## 1. Problem

Developers keep their essentials scattered across too many tools:

| Resource | Typical Location |
| --- | --- |
| Code snippets | VS Code, Notion |
| AI prompts | ChatGPT/Claude conversations |
| Context files | Buried in project folders |
| Useful links | Browser bookmarks |
| Documentation | Random folders |
| Shell commands | `.txt` files, bash history |
| Project templates | GitHub Gists |

This creates **context switching**, **lost knowledge**, and **inconsistent workflows**. DevStash provides a single searchable home for all of it.

---

## 2. Target Users

- **Everyday Developer** — Quick access to snippets, prompts, commands, links.
- **AI-first Developer** — Saves prompts, contexts, workflows, system messages.
- **Content Creator / Educator** — Stores code blocks, explanations, course notes.
- **Full-stack Builder** — Collects patterns, boilerplates, API examples.

---

## 3. Feature Overview

### A. Items & Item Types

Items are the core unit. Each item has a **type** that determines how it's stored and rendered. Users can eventually create custom types, but the system ships with these built-in types (immutable):

| Type | Storage | Tier |
| --- | --- | --- |
| `snippet` | text | Free |
| `prompt` | text | Free |
| `note` | text | Free |
| `command` | text | Free |
| `link` | url | Free |
| `file` | file (R2) | Pro |
| `image` | file (R2) | Pro |

**Storage categories:**

- **Text** — snippet, prompt, note, command
- **URL** — link
- **File** — file, image

Items are quick to access and create through a **drawer UI** (no page navigation required).

URL convention: `/items/[type]` → e.g. `/items/snippets`, `/items/prompts`.

### B. Collections

Users can create collections that hold items of any type. **An item can belong to multiple collections** via a join table.

Examples:

- *React Patterns* — snippets, notes
- *Context Files* — files
- *Python Snippets* — snippets
- *Interview Prep* — mixed types

### C. Search

Powerful search across **content**, **tags**, **titles**, and **types**.

### D. Authentication

- Email + password (NextAuth Credentials provider)
- GitHub OAuth

### E. Quality-of-life Features

- Favorites (items + collections)
- Pin items to top
- Recently used
- Import code from file
- Markdown editor for text types
- File upload for file/image types
- Export data (JSON / ZIP)
- Dark mode (default) + light mode
- Multi-collection assignment with visibility into which collections an item belongs to

### F. AI Features (Pro Only)

- Auto-tag suggestions
- Summaries
- "Explain this code"
- Prompt optimizer

---

## 4. Data Model (Rough Draft)

> ⚠️ **Draft schema — not final.** Relations and constraints will be refined during implementation. All schema changes go through **Prisma migrations** (never `db push`).

### 4.1 Prisma Schema
```prisma
// schema.prisma — ROUGH DRAFT

model User {
  id                   String       @id @default(cuid())
  email                String       @unique
  name                 String?
  image                String?
  // Pro / billing
  isPro                Boolean      @default(false)
  stripeCustomerId     String?      @unique
  stripeSubscriptionId String?      @unique
  // Relations
  accounts             Account[]    // NextAuth
  sessions             Session[]    // NextAuth
  items                Item[]
  collections          Collection[]
  itemTypes            ItemType[]   // user-created custom types
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
}

model Item {
  id          String           @id @default(cuid())
  title       String
  contentType ContentType      // text | file | url
  content     String?          // text body, null when file
  fileUrl     String?          // R2 URL, null when text
  fileName    String?
  fileSize    Int?             // bytes
  url         String?          // for link type
  description String?
  language    String?          // for syntax highlighting
  isFavorite  Boolean          @default(false)
  isPinned    Boolean          @default(false)
  // Relations
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  itemType    ItemType         @relation(fields: [itemTypeId], references: [id])
  itemTypeId  String
  tags        Tag[]            @relation("ItemTags")
  collections ItemCollection[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

model ItemType {
  id        String   @id @default(cuid())
  name      String
  icon      String   // lucide icon name
  color     String   // hex
  isSystem  Boolean  @default(false)
  // null user = built-in system type
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String?
  items     Item[]

  @@unique([userId, name])
}

model Collection {
  id            String           @id @default(cuid())
  name          String
  description   String?
  isFavorite    Boolean          @default(false)
  defaultTypeId String?          // pre-fill type for new items
  // Relations
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String
  items         ItemCollection[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([userId])
}

model ItemCollection {
  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  itemId       String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  collectionId String
  addedAt      DateTime   @default(now())

  @@id([itemId, collectionId])
  @@index([collectionId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  items Item[] @relation("ItemTags")
}

enum ContentType {
  TEXT
  FILE
  URL
}
```

**Notes on the draft:**

- `ItemCollection` is an explicit join model so we can track `addedAt` (per spec).
- `ItemType.userId` is nullable — `null` means a system type shared by everyone.
- `Tag` is global by default; if tags need to be scoped per-user, add `userId` and adjust the unique constraint.
- NextAuth's `Account` and `Session` tables are omitted here but required.

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│            Next.js 16 / React 19 / Tailwind v4          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Server (SSR + API)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  App Router  │  │  API Routes  │  │   NextAuth   │  │
│  │  (RSC + UI)  │  │  (REST/JSON) │  │     v5       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──┬───────────┬──────────────┬─────────────┬────────────┘
   │           │              │             │
   ▼           ▼              ▼             ▼
┌──────┐  ┌─────────┐   ┌──────────┐  ┌──────────┐
│ Neon │  │  R2     │   │  OpenAI  │  │  Stripe  │
│  PG  │  │ Storage │   │  API     │  │  Billing │
│Prisma│  │ (files) │   │(gpt-5-   │  │          │
│      │  │         │   │  nano)   │  │          │
└──────┘  └─────────┘   └──────────┘  └──────────┘
```

### 5.2 Item Creation Flow

```
User clicks "+ New Item"
        │
        ▼
   Drawer opens
        │
        ▼
 Pick type ──► (file/image?) ─Yes─► Upload to R2 ──┐
        │                                          │
        No                                         │
        │                                          │
        ▼                                          ▼
  Markdown editor ─────────────────────► POST /api/items
                                                   │
                                                   ▼
                                          Prisma → Neon PG
                                                   │
                                          (Pro?) AI auto-tag
                                                   │
                                                   ▼
                                          Toast + revalidate
```

### 5.3 Free vs Pro Gating

```
Request → middleware/server action
            │
            ▼
       isPro check
       ┌────┴────┐
       │         │
     Free       Pro
       │         │
       ▼         ▼
  Quota check   Unlimited
  (50 items,    + AI + files
   3 colls)     + export
       │
       ▼
   Allow / 402
```

---

## 6. Tech Stack

### Framework & Language

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) / React 19 | SSR pages with dynamic components, API routes, single repo |
| Language | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |

### Data Layer

| Layer | Choice | Notes |
| --- | --- | --- |
| Database | [Neon Postgres](https://neon.tech/) | Serverless Postgres in the cloud |
| ORM | [Prisma 7](https://www.prisma.io/docs) | Always pull latest docs before migrations |
| Cache | [Redis](https://redis.io/) (TBD) | Optional — for hot reads / search |
| File storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) | S3-compatible, cheap egress |

> **🚫 Migration policy:** **NEVER** use `prisma db push` or hand-edit production schema. Every change is a tracked migration → run in dev → run in prod.

### Auth, AI, Payments

| Layer | Choice | Notes |
| --- | --- | --- |
| Auth | [NextAuth v5](https://authjs.dev/) | Email/password + GitHub OAuth |
| AI | OpenAI `gpt-5-nano` | Tagging, summaries, code explain, prompt optimizer |
| Payments | [Stripe](https://stripe.com/) | Subscriptions for Pro tier |

### UI

| Layer | Choice |
| --- | --- |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) |
| Icons | [Lucide](https://lucide.dev/) |

---

## 7. Monetization

Freemium model. **During development, all users get full access** — gating is wired in but bypassed via a flag.

### Free

- 50 items total
- 3 collections
- All system types **except** files/images
- Basic search
- No AI features

### Pro — $8/month or $72/year

- Unlimited items & collections
- File + image uploads
- Custom types *(later)*
- AI auto-tagging
- AI code explanation
- AI prompt optimizer
- Export data (JSON / ZIP)
- Priority support

---

## 8. UI/UX Guidelines

### Design Direction

Modern, minimal, developer-focused. References: **Notion** (https://notion.com), **Linear** (https://linear.app), **Raycast** (https://raycast.com).

- Dark mode by default; light mode optional
- Clean typography, generous whitespace
- Subtle borders and shadows
- Syntax highlighting for code blocks
- Smooth transitions, hover states, toast notifications, loading skeletons

### Screenshots
Refer to the screennshots below as a base for the dashboard UI. It is does not have to be axact. Use it as reference only:
- @context/screenshots/dasboard-ui-main.png
- @context/screenshots/dasboard-ui-drawer.png


### Layout

- **Sidebar + main content**, sidebar collapsible
- **Sidebar contents:** item-type links (Snippets, Commands, …), recent collections
- **Main view:** grid of collection cards
  - Collection card **background color** = dominant item-type color in that collection
  - Item cards inside use **border color** matching their type
- **Item detail:** opens in a quick-access drawer (no full page navigation)

### Responsive

- Desktop-first, mobile usable
- Sidebar collapses into a drawer on mobile

---

## 9. Type System Reference

| Type | Color | Hex | Lucide Icon | Storage | Tier |
| --- | --- | --- | --- | --- | --- |
| Snippet | Blue | `#3b82f6` | `Code` | text | Free |
| Prompt | Purple | `#8b5cf6` | `Sparkles` | text | Free |
| Command | Orange | `#f97316` | `Terminal` | text | Free |
| Note | Yellow | `#fde047` | `StickyNote` | text | Free |
| Link | Emerald | `#10b981` | `Link` | url | Free |
| File | Gray | `#6b7280` | `File` | file | Pro |
| Image | Pink | `#ec4899` | `Image` | file | Pro |

---

## 10. Open Questions / TBD

- **Tag scope** — global or per-user? Affects uniqueness constraint on `Tag.name`.
- **Redis caching** — needed at MVP or wait for scale signal?
- **Custom item types** — Pro-tier feature; deferred to v2.
- **Search backend** — Postgres full-text initially; Meilisearch / Typesense if results get sluggish.
- **Soft delete vs hard delete** — should items have a `deletedAt` for "trash" / undo?
- **Quota enforcement** — return `402` with a friendly upgrade prompt, or block at the form layer?
- **Export format details** — what does the ZIP layout look like (one file per item? grouped by collection?).
- **Rate limiting** — especially around AI endpoints to control OpenAI spend.
