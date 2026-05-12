# Item CRUD Architecture

A unified design for creating, reading, updating, and deleting all 7 item types through a single action file, a shared DB layer, and components that adapt by type.

---

## Guiding Principles

- **Mutations → server actions** (`src/actions/items.ts`)
- **Queries → db layer** (`src/lib/db/items.ts`), called directly from server components
- **Type-specific UI → components**, not actions — actions are type-agnostic; they receive `contentType` and write the correct fields based on it
- **One dynamic route** handles all 7 types; the page reads the `[type]` param and filters accordingly
- **Drawer pattern** for create/view/edit — no separate item detail pages

---

## File Structure

```
src/
├── actions/
│   └── items.ts                  # all item mutations (create, update, delete, toggles)
│
├── lib/db/
│   └── items.ts                  # extend existing — add getItemsByType, getItemById
│
├── app/
│   └── (dashboard)/              # route group — shares DashboardShell, no URL prefix
│       ├── layout.tsx            # DashboardShell (moved from dashboard/)
│       ├── dashboard/
│       │   └── page.tsx          # existing dashboard page (moved)
│       └── items/
│           └── [type]/
│               └── page.tsx      # list view for one item type
│
└── components/
    └── items/
        ├── ItemList.tsx          # renders a grid of ItemCards for the [type] page
        ├── ItemDrawer.tsx        # Sheet — create / view / edit, opens from ItemCard click or "+ New"
        ├── ItemForm.tsx          # unified form, switches field components by contentType
        └── fields/
            ├── TextField.tsx     # Markdown editor — used by snippet, prompt, command, note
            ├── UrlField.tsx      # URL + description inputs — used by link
            └── FileField.tsx     # File upload — used by file, image
```

> **Note on route group:** Moving `src/app/dashboard/` → `src/app/(dashboard)/dashboard/` and the layout to `src/app/(dashboard)/layout.tsx` makes item URLs `/items/snippets` (matching the spec) instead of `/dashboard/items/snippets`. The `(dashboard)` folder name is invisible in the URL.

---

## Routing: `/items/[type]`

### URL convention

The `[type]` param is the **plural slug** of the item type name:

| URL | Type name (DB) |
|-----|----------------|
| `/items/snippets` | `snippet` |
| `/items/prompts` | `prompt` |
| `/items/commands` | `command` |
| `/items/notes` | `note` |
| `/items/links` | `link` |
| `/items/files` | `file` |
| `/items/images` | `image` |

The slug-to-name map lives in `src/lib/constants.ts`:

```ts
export const TYPE_SLUG_MAP: Record<string, string> = {
  snippets: "snippet",
  prompts:  "prompt",
  commands: "command",
  notes:    "note",
  links:    "link",
  files:    "file",
  images:   "image",
};
```

### Page component (`src/app/(dashboard)/items/[type]/page.tsx`)

```ts
// Server component — calls db layer directly, no API round-trip
export default async function ItemTypePage({ params }: { params: { type: string } }) {
  const typeName = TYPE_SLUG_MAP[params.type];
  if (!typeName) notFound();

  const session = await auth();
  const items = await getItemsByType(session.user.id, typeName);

  return <ItemList items={items} typeName={typeName} />;
}
```

---

## Data Fetching — `src/lib/db/items.ts`

Extend the existing file with two new functions:

### `getItemsByType(userId, typeName, options?)`

```ts
// Returns items filtered by type name, ordered newest-first
// Used by /items/[type] page
export async function getItemsByType(
  userId: string,
  typeName: string,
  options: { limit?: number } = {}
): Promise<ItemForCard[]>
```

Query: `prisma.item.findMany({ where: { userId, itemType: { name: typeName } } })`

### `getItemById(userId, id)`

```ts
// Returns full item for the drawer view/edit form
// Includes all fields — not just the card subset
export async function getItemById(
  userId: string,
  id: string
): Promise<ItemDetail | null>
```

`ItemDetail` type includes everything `ItemForCard` has plus `content`, `url`, `fileUrl`, `fileName`, `fileSize`, `language`, `isPinned`, `contentType`.

---

## Mutations — `src/actions/items.ts`

All mutations in one file. Each action:
1. Calls `auth()` — throws if no session
2. Validates input (zod schemas)
3. Writes to DB via Prisma
4. Calls `revalidatePath()` to refresh the relevant page

```ts
"use server";

export async function createItem(formData: FormData): Promise<ActionResult>
export async function updateItem(id: string, formData: FormData): Promise<ActionResult>
export async function deleteItem(id: string): Promise<ActionResult>
export async function toggleFavorite(id: string, isFavorite: boolean): Promise<ActionResult>
export async function togglePin(id: string, isPinned: boolean): Promise<ActionResult>
```

### Ownership check (update / delete / toggles)

Before mutating, verify the item belongs to the session user:

```ts
const item = await prisma.item.findUnique({ where: { id }, select: { userId: true } });
if (!item || item.userId !== session.user.id) throw new Error("Not found");
```

### Type-agnostic writes

Actions do not branch on item type name. They write based on `contentType`:

```ts
// Derived from the itemTypeId's ContentType — or passed directly from the form
if (contentType === "TEXT")  { data.content = formData.get("content") }
if (contentType === "URL")   { data.url = formData.get("url") }
if (contentType === "FILE")  { data.fileUrl = ...; data.fileName = ...; data.fileSize = ... }
```

### `revalidatePath` targets

| Action | Revalidate |
|--------|------------|
| createItem | `/items/[type]`, `/dashboard` |
| updateItem | `/items/[type]`, `/dashboard` |
| deleteItem | `/items/[type]`, `/dashboard` |
| toggleFavorite / togglePin | `/dashboard` (affects pinned/recent sections) |

---

## Components

### `ItemList`

Client or server component. Renders a responsive grid of `ItemCard`s. Receives `items: ItemForCard[]` and `typeName` as props.

- Shows empty state when `items.length === 0`
- Passes an `onSelect` handler to each `ItemCard` to open the drawer

### `ItemDrawer`

Client component wrapping shadcn `Sheet`. Has two modes:

| Mode | Trigger | Content |
|------|---------|---------|
| **Create** | "+ New Item" button (header) | Empty `ItemForm` pre-set to the current type |
| **View/Edit** | Click on an `ItemCard` | Populated `ItemForm` + Delete button |

State: `{ open: boolean, mode: "create" | "edit", item?: ItemDetail }`

### `ItemForm`

Client component. Receives `contentType` (and optionally a pre-populated `item` for edit mode).

```
ItemForm
  ├── title input (all types)
  ├── description input (all types, optional)
  ├── tags input (all types, optional)
  │
  ├── contentType === "TEXT"  → <TextField />   (Markdown editor + language selector)
  ├── contentType === "URL"   → <UrlField />    (URL input)
  └── contentType === "FILE"  → <FileField />   (file upload)
  │
  └── submit → calls createItem / updateItem server action
```

The form calls the server action directly via `action={createItem}` or via `startTransition` for optimistic updates.

### Field components (`src/components/items/fields/`)

| Component | Types | Responsibility |
|-----------|-------|----------------|
| `TextField` | snippet, prompt, command, note | Markdown textarea + optional language selector (snippet, command only) |
| `UrlField` | link | URL text input + description textarea |
| `FileField` | file, image | File drag-and-drop / input; uploads to R2 before form submit; stores resulting URL |

Field components are pure UI — no server calls except `FileField` which calls the R2 upload endpoint.

---

## Where Type-Specific Logic Lives

| Concern | Location | Why |
|---------|----------|-----|
| Icon & color | `ItemType` DB row → passed through `ItemForCard.itemType` | Single source of truth — no hardcoding in components |
| Icon rendering | `ItemCard` via `iconMap` | Already implemented |
| Editor type | `ItemForm` branching on `contentType` | `contentType` is a schema enum, not a type name string |
| Language selector | `TextField` (only shown for snippet/command) | Could check `itemType.name` or pass a `showLanguage` prop from `ItemForm` |
| File upload | `FileField` only | No other type touches R2 |
| Plural URL slug | `TYPE_SLUG_MAP` in `constants.ts` | One mapping table; components never need it |
| Pro gating | `SidebarContent` (already flags `isPro`) + action-level check | Server action checks `session.user.isPro` before accepting file uploads |

---

## Existing Code Integration

| Existing file | Change needed |
|---------------|---------------|
| `src/lib/db/items.ts` | Add `getItemsByType`, `getItemById`, `ItemDetail` type |
| `src/lib/db/sidebar.ts` | None — already provides type counts and navigation data |
| `src/lib/icon-map.ts` | None — used by `ItemCard` as-is |
| `src/lib/constants.ts` | Add `TYPE_SLUG_MAP` |
| `src/components/dashboard/ItemCard.tsx` | Add `onClick` prop to open drawer |
| `src/app/dashboard/layout.tsx` | Move to `(dashboard)` route group if adopting spec URLs |
| `src/actions/auth.ts` | No change |

---

## Data Flow Summary

```
User clicks "+ New Item" or an ItemCard
        │
        ▼
  ItemDrawer opens (client state)
        │
        ▼
  ItemForm renders TextField / UrlField / FileField
  based on contentType
        │
        ▼
  User submits
        │
        ├─ FILE type → FileField POSTs to R2 upload endpoint first → gets fileUrl
        │
        ▼
  createItem / updateItem server action
    → auth() check
    → zod validation
    → prisma.item.create / update
    → revalidatePath(["/items/type", "/dashboard"])
        │
        ▼
  Drawer closes, page re-renders with fresh data
  (no client state sync needed — RSC revalidation handles it)
```
