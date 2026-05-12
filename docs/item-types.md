# Item Types

RCD-DevStash ships with 7 immutable system item types. Each is seeded with `isSystem: true` and `userId: null` so it is shared across all users.

---

## Quick Reference

| Type    | Color   | Hex       | Icon        | Storage | ContentType | Tier |
|---------|---------|-----------|-------------|---------|-------------|------|
| snippet | Blue    | `#3b82f6` | `Code`      | text    | TEXT        | Free |
| prompt  | Purple  | `#8b5cf6` | `Sparkles`  | text    | TEXT        | Free |
| command | Orange  | `#f97316` | `Terminal`  | text    | TEXT        | Free |
| note    | Yellow  | `#fde047` | `StickyNote`| text    | TEXT        | Free |
| link    | Emerald | `#10b981` | `Link`      | url     | URL         | Free |
| file    | Gray    | `#6b7280` | `File`      | file    | FILE        | Pro  |
| image   | Pink    | `#ec4899` | `Image`     | file    | FILE        | Pro  |

---

## Per-Type Details

### snippet
- **Purpose:** Reusable code blocks with syntax highlighting.
- **Key fields:** `content` (required), `language` (used for syntax highlighting, e.g. `"typescript"`, `"bash"`)
- **ContentType:** `TEXT`
- **URL route:** `/items/snippets`

### prompt
- **Purpose:** AI prompts — system messages, workflow templates, LLM instructions.
- **Key fields:** `content` (required); `language` is typically unused
- **ContentType:** `TEXT`
- **URL route:** `/items/prompts`

### command
- **Purpose:** Shell/CLI commands, one-liners, and multi-step scripts.
- **Key fields:** `content` (required), `language` (commonly `"bash"` or `"sh"`)
- **ContentType:** `TEXT`
- **URL route:** `/items/commands`

### note
- **Purpose:** Freeform markdown notes, documentation, explanations.
- **Key fields:** `content` (required); no `language` needed
- **ContentType:** `TEXT`
- **URL route:** `/items/notes`

### link
- **Purpose:** Bookmarked URLs with an optional description.
- **Key fields:** `url` (required), `description` (optional summary)
- **ContentType:** `URL`
- **URL route:** `/items/links`

### file
- **Purpose:** Uploaded files stored in Cloudflare R2 (e.g. PDFs, config files, templates).
- **Key fields:** `fileUrl` (R2 object URL), `fileName`, `fileSize` (bytes)
- **ContentType:** `FILE`
- **Tier:** Pro only
- **URL route:** `/items/files`

### image
- **Purpose:** Uploaded images stored in Cloudflare R2 (screenshots, diagrams, references).
- **Key fields:** `fileUrl` (R2 object URL), `fileName`, `fileSize` (bytes)
- **ContentType:** `FILE`
- **Tier:** Pro only
- **URL route:** `/items/images`

---

## Storage Classification

```
TEXT  → snippet | prompt | command | note
         Fields: content, language?

URL   → link
         Fields: url, description?

FILE  → file | image
         Fields: fileUrl, fileName, fileSize
         Stored in: Cloudflare R2
```

---

## Shared Item Properties

All items (regardless of type) share these fields (`prisma/schema.prisma` — `Item` model):

| Field        | Type      | Notes                                        |
|--------------|-----------|----------------------------------------------|
| id           | String    | cuid                                         |
| title        | String    | Required                                     |
| contentType  | ContentType | Enum: TEXT / FILE / URL                    |
| content      | String?   | Markdown body — TEXT types only              |
| fileUrl      | String?   | R2 URL — FILE types only                     |
| fileName     | String?   | Original filename — FILE types only          |
| fileSize     | Int?      | Bytes — FILE types only                      |
| url          | String?   | Bookmark URL — URL type only                 |
| description  | String?   | Optional summary (all types)                 |
| language     | String?   | Syntax highlighting hint — TEXT types        |
| isFavorite   | Boolean   | Default false                                |
| isPinned     | Boolean   | Default false                                |
| userId       | String    | Owner                                        |
| itemTypeId   | String    | FK → ItemType                                |
| tags         | Tag[]     | Many-to-many via `"ItemTags"` relation       |
| collections  | ItemCollection[] | Many-to-many via join table            |
| createdAt    | DateTime  |                                              |
| updatedAt    | DateTime  |                                              |

---

## Display Differences

| Type    | Editor        | Syntax highlight | Preview         |
|---------|---------------|------------------|-----------------|
| snippet | Markdown + code block | Yes (`language`) | Code block |
| prompt  | Markdown      | No               | Formatted text  |
| command | Markdown + code block | Yes (`language`) | Code block |
| note    | Markdown      | No               | Formatted text  |
| link    | URL + description field | No         | URL + description |
| file    | File upload   | No               | File name + size |
| image   | File upload   | No               | Image preview   |

---

## ItemType Model (schema)

```prisma
model ItemType {
  id       String  @id @default(cuid())
  name     String
  icon     String   // Lucide icon name, e.g. "Code"
  color    String   // Hex color, e.g. "#3b82f6"
  isSystem Boolean  @default(false)
  userId   String?  // null = system type; non-null = user-created custom type
  user     User?    @relation(...)
  items    Item[]

  @@unique([userId, name])
}
```

System types have `userId: null`. Custom types (Pro, deferred to v2) are scoped to a user.

---

## Sources

- `context/project-overview.md` — Section 9 (Type System Reference), Section 3A (item type table)
- `prisma/schema.prisma` — `Item`, `ItemType`, `ContentType` enum
- `prisma/seed.ts` — `SYSTEM_TYPES` array (authoritative names, icons, colors)
