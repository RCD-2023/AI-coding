# Code Scan — RCD-DevStash

**Date:** 2026-05-14
**Auditor:** Claude Code (nextjs-code-auditor agent)
**Scope:** Full codebase audit — Security, Performance, Code Quality, Decomposition

---

## CRITICAL

### [CRITICAL] — Route Protection Middleware Is Not Active

**File:** `src/proxy.ts`
**Category:** Security

**Description:**
Next.js middleware must live at `middleware.ts` (project root) or `src/middleware.ts`. The file `src/proxy.ts` exports a `proxy` named function and a `config` matcher, but Next.js will never execute it as middleware — it is just a regular module sitting on disk, completely inert.

The consequence is that the protected routes listed in `config.matcher` (`/dashboard/:path*`, `/profile`, `/items/:path*`) receive **no edge-level auth guard**. Unauthenticated users can attempt to reach these routes directly. The individual page-level `auth()` calls do provide a fallback guard (the server renders and redirects), but the edge middleware layer — the intended first line of defense — is silently absent.

**Evidence:**
```ts
// src/proxy.ts — never invoked by Next.js
export const proxy = auth(function proxy(req) {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/items/:path*"],
}
```
There is no `src/middleware.ts` or `middleware.ts` at the project root.

**Suggested Fix:**
Rename `src/proxy.ts` to `src/middleware.ts` and change the default export to match the Next.js convention:

```ts
// src/middleware.ts
import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(function middleware(req) {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/items/:path*"],
}
```

---

## HIGH

### [HIGH] — Header Injection via Unescaped `fileName` in Content-Disposition

**File:** `src/app/api/items/[id]/download/route.ts` (line 42)
**Category:** Security

**Description:**
The `Content-Disposition` header is built by interpolating `item.fileName` directly from the database:

```ts
"Content-Disposition": `attachment; filename="${item.fileName ?? "download"}"`,
```

If a `fileName` value in the database contains a double-quote, newline (`\r\n`), or other special characters, this becomes a response header injection vector. An attacker who can store a crafted filename (e.g., via the upload API) can inject arbitrary HTTP headers into the download response.

The upload route does capture the original `file.name` from the browser, which itself cannot be trusted to be free of special characters. The upload route stores this directly:
```ts
ContentDisposition: `inline; filename="${file.name}"`,  // also unescaped
```

**Suggested Fix:**
Sanitize or RFC 5987-encode the filename before embedding it in the header:

```ts
const safeName = (item.fileName ?? "download").replace(/["\r\n\\]/g, "_");
"Content-Disposition": `attachment; filename="${safeName}"`,
```

For full RFC 5987 compliance (handles Unicode names), use the `filename*` parameter:
```ts
const encoded = encodeURIComponent(item.fileName ?? "download");
"Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
```

Apply the same fix to the `ContentDisposition` set in `src/app/api/upload/route.ts` (line 88).

---

### [HIGH] — N+1 Query in `getItemsByTypeSlug` — All System Types Fetched to Match One

**File:** `src/lib/db/items.ts` (lines 129–131) and `src/actions/items.ts` (lines 109–114)
**Category:** Performance

**Description:**
`getItemsByTypeSlug` fetches **all system item types** from the database in order to find the one matching the URL slug:

```ts
const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } });
const matched = allTypes.find(
  (t) => t.name.toLowerCase() + "s" === typeSlug.toLowerCase()
);
```

The `createItem` server action repeats the same pattern. Depending on how many system types exist this is a minor extra query, but more importantly both of these are doing application-level filtering of what should be a single-row database lookup. This also means the type-matching logic is duplicated across two files.

**Suggested Fix:**
Match the type in the database directly. Since the slug is `name + "s"` (e.g., `snippets` → `snippet`), strip the trailing `s` and query directly:

```ts
// In items.ts
const typeName = typeSlug.endsWith("s") ? typeSlug.slice(0, -1) : typeSlug;
const matched = await prisma.itemType.findFirst({
  where: { isSystem: true, name: { equals: typeName, mode: "insensitive" } },
});
```

Or, for the create action, accept the `typeSlug` already validated against a known constant set (the `ITEM_TYPES` list in `CreateItemDialog`) and look up the type by exact name.

---

### [HIGH] — `getItemTypesForSidebar` Loads All Item IDs Into Memory to Count Them

**File:** `src/lib/db/sidebar.ts` (lines 29–39)
**Category:** Performance

**Description:**
The sidebar loads every item record (selecting only `id`) for every system type, then counts them with `t.items.length` in JavaScript:

```ts
const types = await prisma.itemType.findMany({
  where: { isSystem: true },
  include: {
    items: {
      where: { userId },
      select: { id: true },   // one row per item per type
    },
  },
});
return types.map((t) => ({ ...t, count: t.items.length }));
```

For a user with 500 snippets, this fetches 500 `{ id }` rows across the wire just to count them. This should be a `COUNT` aggregate in the database.

**Suggested Fix:**
```ts
// Use _count relation aggregate instead
const types = await prisma.itemType.findMany({
  where: { isSystem: true },
  include: {
    _count: {
      select: { items: { where: { userId } } },
    },
  },
});
return types.map((t) => ({
  id: t.id,
  name: t.name,
  icon: t.icon,
  color: t.color,
  count: t._count.items,
  isPro: PRO_TYPES.has(t.name),
}));
```

---

### [HIGH] — `getCollectionsForSidebar` Fetches All Collection Items (Including Full Item and ItemType) for a Dominance Color Calculation

**File:** `src/lib/db/sidebar.ts` (lines 49–91)
**Category:** Performance

**Description:**
To calculate the "dominant color" of a collection (the most-used item type's color), the sidebar query includes every `ItemCollection`, each with its full `Item` and `Item.itemType`. For a user with large collections, this can pull thousands of rows on every page load of any route wrapped in `DashboardShell` (dashboard, items pages, profile).

```ts
include: {
  items: {
    include: {
      item: {
        include: { itemType: { select: { name: true, color: true } } },
      },
    },
  },
},
```

A similar over-fetch exists in `getCollectionsForUser` in `src/lib/db/collections.ts` (lines 20–30), which fetches full `itemType` for every item in every collection to compute the dominant color for dashboard collection cards.

**Suggested Fix:**
Use `_count` for item counts and a grouped subquery or a raw aggregation to determine the dominant type. A simpler intermediate step is to select only the minimal fields needed from `ItemCollection → Item → ItemType`:

```ts
items: {
  select: {
    item: {
      select: { itemType: { select: { name: true, color: true } } },
    },
  },
},
```

This eliminates all other Item columns from the wire transfer. A more thorough fix would be to materialize dominant color on the `Collection` model itself and recompute it on item add/remove.

---

## MEDIUM

### [MEDIUM] — `middleware.ts` Is Missing; Auth Guard Relies Solely on Per-Page `auth()` Calls

*(This is the corollary to the CRITICAL issue above.)*

**File:** `src/app/dashboard/layout.tsx`, `src/app/items/[type]/layout.tsx`, `src/app/profile/layout.tsx`
**Category:** Security / Code Quality

**Description:**
Because the middleware is not active, each of the three layout files independently calls `auth()` but does **not redirect** on failure — they fall through with `userId = ""` and render partial or empty UI. Only the `src/app/profile/page.tsx` page has an explicit `redirect("/sign-in")` guard. Dashboard and items type pages silently render with no user data.

```ts
// src/app/dashboard/layout.tsx
const session = await auth();
const userId = session?.user?.id ?? "";   // empty string on unauthenticated — no redirect
const sidebarData = userId ? await getSidebarData(userId) : null;
```

**Suggested Fix:**
Add auth guards to the layouts, or — better — fix the middleware (see CRITICAL issue). Once middleware is active this becomes defense-in-depth rather than the sole guard:

```ts
const session = await auth();
if (!session?.user?.id) redirect("/sign-in");
```

---

### [MEDIUM] — `src/lib/constants.ts` Contains a Stale Leftover Constant

**File:** `src/lib/constants.ts`
**Category:** Code Quality

**Description:**
The file exports a `DEMO_USER_EMAIL` constant with a comment saying it is "temporary" and will be replaced when auth is wired up. Auth is now fully wired up and the constant is never imported anywhere in the codebase (confirmed by grep). This is dead code that will confuse future readers.

**Evidence:**
```ts
// Temporary: replaced with session user when auth is wired up
export const DEMO_USER_EMAIL = "demo@devstash.io";
```
No other file imports `DEMO_USER_EMAIL`.

**Suggested Fix:**
Delete the contents of `src/lib/constants.ts` or the file itself. If the file is intended as the home of future constants, leave a blank or placeholder comment.

---

### [MEDIUM] — `ItemDrawer` Has a Logic Bug: URL Is Displayed in the Language Section

**File:** `src/components/dashboard/ItemDrawer.tsx` (lines 441–467)
**Category:** Code Quality / Logic Error

**Description:**
The view-mode block for the language/URL sections has a structural mistake. When not editing, the URL section is rendered **inside** the language conditional:

```tsx
{isEditing && showLanguage ? (
  <section>{/* language input */}</section>
) : (
  !isEditing &&
  item.url && (      // ← URL display rendered as the "else" to the language block
    <section>
      {fieldLabel("URL")}
      <a href={item.url} ...>{item.url}</a>
    </section>
  )
)}

{/* URL */}
{isEditing && showUrl ? (
  <section>{/* url input */}</section>
) : (
  !isEditing &&
  item.url && (      // ← URL displayed again in the URL block
    <section>...</section>
  )
)}
```

In view mode for a `link` item:
- `showLanguage` is `false` (links don't have language), so the language ternary's else branch fires, rendering the URL.
- Then the URL block also fires (`showUrl` is false in view mode — the condition is `isEditing && showUrl`), but its else branch renders `item.url` again.

The result is that the URL is displayed **twice** on link items in view mode.

For non-link items that have `item.url` set (unusual, but possible), the URL would be rendered under the language section heading with no label.

**Suggested Fix:**
Separate the view and edit conditions cleanly. In view mode, URL should only render in the URL section:

```tsx
{/* Language — edit only */}
{isEditing && showLanguage && (
  <section>
    {fieldLabel("Language")}
    <Input ... />
  </section>
)}

{/* URL — edit only */}
{isEditing && showUrl && (
  <section>
    {fieldLabel("URL")}
    <Input ... />
  </section>
)}

{/* URL — view only */}
{!isEditing && item.url && (
  <section>
    {fieldLabel("URL")}
    <a href={item.url} target="_blank" rel="noopener noreferrer" ...>
      {item.url}
    </a>
  </section>
)}
```

---

### [MEDIUM] — Password Validation Is Inconsistent Between Register and Reset-Password

**File:** `src/app/api/auth/register/route.ts` (no minimum length check) vs `src/app/api/auth/reset-password/route.ts` (line 22)
**Category:** Security / Code Quality

**Description:**
The register route does not validate a minimum password length server-side. The reset-password route enforces 8 characters. A user could register with a 1-character password if they bypass the browser form.

```ts
// register/route.ts — no length check, only checks non-empty
if (!name || !email || !password || !confirmPassword) { ... }

// reset-password/route.ts — explicit check
if (password.length < 8) { ... }
```

**Suggested Fix:**
Add the same check to the register route:
```ts
if (password.length < 8) {
  return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
}
```

---

### [MEDIUM] — `usePasswordResetToken` Has a TOCTOU Race: Token Deleted After Expiry Check

**File:** `src/lib/db/verification-token.ts` (lines 18–41)
**Category:** Security / Code Quality

**Description:**
`usePasswordResetToken` performs a `findFirst`, then conditionally deletes the token in a separate query. Between the expiry check and the delete, two concurrent requests with the same token could both pass the expiry check and both receive a valid `email` response — allowing a reset token to be used twice.

```ts
const record = await prisma.verificationToken.findFirst({ where: { token } })
if (record.expires < new Date()) {
  await prisma.verificationToken.delete(...)   // only expired path deletes early
  return "expired"
}
// ... valid path:
await prisma.verificationToken.delete(...)     // separate delete from the check
return { email }
```

The window is narrow (two requests must overlap at exactly this moment), but token reuse would allow an attacker who intercepts a reset token to reset the password twice.

**Suggested Fix:**
Use a transaction that atomically reads and deletes the token, or use `deleteMany` with a filter that includes the expiry check, accepting that "0 rows deleted" means the token was already used or expired:

```ts
// Atomic delete-if-valid
const deleted = await prisma.verificationToken.deleteMany({
  where: {
    token,
    identifier: { startsWith: "reset:" },
    expires: { gt: new Date() },
  },
})
if (deleted.count === 0) return "invalid" // expired or already used
const email = record.identifier.slice("reset:".length) // need the record first
```

A cleaner approach is `$transaction` wrapping findUnique + delete, which Prisma serializes.

---

### [MEDIUM] — `ItemDrawer` Fetches Item via `fetch()` Without Error Boundary or User Feedback on Network Failure

**File:** `src/components/dashboard/ItemDrawer.tsx` (lines 136–139)
**Category:** Code Quality

**Description:**
The fetch call in `useEffect` silently swallows non-OK responses and all network errors:

```ts
fetch(`/api/items/${itemId}`)
  .then((res) => (res.ok ? res.json() : null))   // non-OK → null, no error message
  .then((data) => setItem(data))
  .finally(() => setLoading(false));
```

If the request fails (network error, 500, session expiry), `item` stays `null` and `loading` goes to `false`. The drawer renders nothing with no user feedback — the user sees a blank drawer.

**Suggested Fix:**
Track an error state and display a message:

```ts
const [fetchError, setFetchError] = useState<string | null>(null);

fetch(`/api/items/${itemId}`)
  .then(async (res) => {
    if (!res.ok) throw new Error(`Failed to load item (${res.status})`);
    return res.json();
  })
  .then((data) => setItem(data))
  .catch(() => setFetchError("Failed to load item. Please try again."))
  .finally(() => setLoading(false));
```

---

### [MEDIUM] — `getCollectionsForSidebar` Counts Items in Application Code Instead of DB

**File:** `src/lib/db/sidebar.ts` (line 80) and `src/lib/db/collections.ts` (line 55)
**Category:** Performance / Code Quality

**Description:**
`col.items.length` is used to count items after pulling all join rows from the database. This is a repeated pattern in both sidebar and collection queries. The Prisma `_count` aggregate would push this work to the database.

(This is partially covered by the HIGH issue on sidebar, but also applies to `getCollectionsForUser` in `collections.ts`.)

---

### [MEDIUM] — `Content-Disposition` in Upload Route Also Sets Unescaped Filename

**File:** `src/app/api/upload/route.ts` (line 88)
**Category:** Security

*(Already described under the HIGH issue for the download route. Reported separately here because it is a different file/route and the upload `ContentDisposition` is stored in R2 metadata, not returned directly as a response header — lower immediate risk, but should still be sanitized for consistency and defense in depth.)*

---

## LOW

### [LOW] — `createItem` Action Fetches All System Types on Every Submission

**File:** `src/actions/items.ts` (lines 109–114)
**Category:** Performance

**Description:**
Every call to `createItem` fetches all system `ItemType` rows to find the one matching `typeSlug`. Since system types are static and never change at runtime, this is wasteful. The type lookup should be a targeted query by name.

```ts
const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } });
const matched = allTypes.find((t) => t.name.toLowerCase() === typeSlug.toLowerCase());
```

**Suggested Fix:**
```ts
const matched = await prisma.itemType.findFirst({
  where: { isSystem: true, name: { equals: typeSlug, mode: "insensitive" } },
});
```

---

### [LOW] — `UserAvatar` Uses `<img>` Instead of Next.js `<Image>` for OAuth Avatars

**File:** `src/components/UserAvatar.tsx` (line 29)
**Category:** Performance

**Description:**
OAuth profile images (GitHub avatars, etc.) are loaded with a raw `<img>` tag. Next.js `<Image>` provides automatic optimization (WebP conversion, lazy loading, size hints). The `eslint-disable` comment acknowledges this is intentional, but for remote OAuth images, the Next.js `<Image>` component with a configured `remotePatterns` entry in `next.config.ts` is the appropriate solution.

The same applies to `ImageThumbnailCard.tsx` (line 9) and `ItemDrawer.tsx` (line 374) for user-uploaded images from R2 — these also use raw `<img>`.

**Suggested Fix:**
For `UserAvatar` (fixed-size, always 32×32 or 64×64):
```tsx
import Image from "next/image";
<Image src={image} alt={name ?? "User"} width={32} height={32} className={...} />
```
Add to `next.config.ts`:
```ts
images: {
  remotePatterns: [
    { hostname: "avatars.githubusercontent.com" },
    { hostname: `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` },
    // or the R2 public URL hostname
  ],
},
```

For R2 images in `ImageThumbnailCard` and `ItemDrawer`, using `<img>` is reasonable given the dynamic and unpredictable nature of uploaded content, but the `eslint-disable` comments should be retained and the decision documented.

---

### [LOW] — `ItemDrawer` Is 614 Lines and Mixes Fetch, State, Edit, Delete, and Display Logic

**File:** `src/components/dashboard/ItemDrawer.tsx`
**Category:** Decomposition

**Description:**
`ItemDrawer` handles: data fetching, loading state, view mode, edit mode, delete confirmation dialog, field error display, file rendering, URL rendering, tag rendering, collection rendering, and action bar rendering. At 614 lines it is the largest component in the codebase and significantly exceeds the ~200-250 line guideline.

**Suggested Decomposition:**
- `ItemDrawerHeader` — type badge, title, edit/view title input
- `ItemDrawerActionBar` — favorite, pin, copy, download, edit, delete buttons
- `ItemDrawerBody` — field sections (description, content, file, url, tags, collections, metadata)
- `ItemDrawerDeleteDialog` — the AlertDialog for deletion
- `useItemDrawer` — custom hook owning the fetch, edit form state, save, and delete logic

This would bring each piece under 150 lines and isolate the data-fetching concern from the presentation.

---

### [LOW] — `fieldLabel` and `FieldError` Helpers Are Duplicated in Two Components

**File:** `src/components/dashboard/CreateItemDialog.tsx` (lines 63–73) and `src/components/dashboard/ItemDrawer.tsx` (lines 69–79)
**Category:** Code Quality / Decomposition

**Description:**
Both components define identical `fieldLabel` and `FieldError` helper functions:

```tsx
// Identical in both files:
function fieldLabel(text: string) { ... }
function FieldError({ errors }: { errors?: string[] }) { ... }
```

**Suggested Fix:**
Extract these to a shared module, e.g. `src/components/dashboard/form-helpers.tsx`, and import from there. This follows the project's existing pattern of feature-scoped components.

---

### [LOW] — `formatBytes` Is Duplicated Across Three Files

**File:** `src/components/dashboard/ItemDrawer.tsx` (line 49), `src/components/ui/file-upload.tsx` (line 21), `src/components/dashboard/FileListRow.tsx` (line 27)
**Category:** Code Quality

**Description:**
An identical `formatBytes` function (with the same 1024/1024\*1024 thresholds and `.toFixed(1)` format) is defined in three separate files.

**Suggested Fix:**
Move to `src/lib/utils.ts` (alongside `cn`) or a new `src/lib/format.ts`:
```ts
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

---

### [LOW] — `DeleteAccountDialog` Has No Confirmation Gate (User Can Delete Accidentally)

**File:** `src/components/profile/DeleteAccountDialog.tsx`
**Category:** Code Quality / UX

**Description:**
The delete account dialog shows a warning message but requires no confirmation input (e.g., typing "delete" or the user's email). A single mis-click on "Yes, delete my account" permanently destroys the account. While the dialog itself is a confirmation step, best practice for irreversible destructive actions is to require a typed confirmation.

This is a UX concern rather than a security vulnerability, but it is actionable and the fix is small.

**Suggested Fix:**
Add an `<Input>` requiring the user to type `"delete"` before the destructive button becomes enabled:
```tsx
const [confirmation, setConfirmation] = useState("");
<Input
  value={confirmation}
  onChange={(e) => setConfirmation(e.target.value)}
  placeholder='Type "delete" to confirm'
/>
<Button
  variant="destructive"
  disabled={pending || confirmation !== "delete"}
  onClick={handleDelete}
>
```

---

### [LOW] — Sidebar Collection Color Calculation Ignores Favorite Collections When Counting Recents

**File:** `src/lib/db/sidebar.ts` (lines 82–87)
**Category:** Logic / Code Quality

**Description:**
The sidebar `getCollectionsForSidebar` function uses a single loop over all collections sorted by `updatedAt desc`. Favorites are pushed into the `favorites` array, and non-favorites are pushed into `recents` **up to the `SIDEBAR_RECENT_LIMIT`**. However, because favorites are separated first and recents only count non-favorite collections, a user with many favorite collections will still see up to 5 recent non-favorites — this is probably correct behavior.

The subtle issue is: a collection that was recently updated but is also a favorite appears in `favorites` but **not** in `recents`, which is the correct behavior. However, if a user has 0 favorites and 10 recent collections, they see only 5 recents — the limit silently truncates the list with no indicator in the UI that more exist. This is minor but worth noting.

No code change needed unless the sidebar is designed to show "show more" — in that case, the count truncation should surface in the UI.

---

## Passed Checks

The following areas were reviewed and found to be implemented correctly:

**Authentication & Authorization**
- `auth()` is called at the top of every API route and server action before any data access.
- `prisma.item.findFirst({ where: { id, userId } })` pattern is used consistently in all item queries — ownership is enforced at the DB level, not application level.
- `deleteItem` action uses `findFirst` with `userId` before delete, preventing cross-user deletion.
- `updateItemInDb` checks ownership via `findFirst` before performing the update.
- JWT strategy correctly propagates `user.id` from `jwt` callback to `session` callback.

**Rate Limiting**
- Login, register, forgot-password, and reset-password routes all use Upstash rate limiting.
- Rate limiter fails open (returns `success: true`) if Upstash is unreachable — intentional design.
- Rate limit keys include IP + email for login, reducing credential stuffing impact.

**File Upload Security**
- Upload route validates both file extension and MIME type (double-check).
- File size limits enforced server-side (5 MB images, 10 MB files).
- R2 keys are scoped to `userId/uuid.ext` — no path traversal possible.
- `itemType` is validated to be `"file"` or `"image"` before extension check.

**Input Validation**
- Zod schemas are used on all `createItem` and `updateItem` server action inputs.
- `superRefine` correctly enforces cross-field rules (link requires URL, file requires fileUrl).
- Register route validates all four required fields before any DB work.

**Password Security**
- bcrypt with cost factor 10 (register) and 12 (changePassword) — appropriate.
- `changePassword` re-verifies the current password before allowing the change.
- Email verification flow uses `$transaction` to atomically mark verified and delete token.

**Token Security**
- Verification and reset tokens use `crypto.randomBytes(32).toString("hex")` — 256 bits of entropy, cryptographically secure.
- Tokens have a 1-hour expiry.
- `useVerificationToken` uses the composite unique key `{ identifier_token }` — immune to timing attacks on the raw token alone.
- Password reset tokens are namespaced with `reset:` prefix in the identifier column to avoid collision with email verification tokens.

**Database**
- Prisma ORM used throughout — no raw SQL, no injection risk.
- `onDelete: Cascade` correctly propagates deletes from User to Items, Collections, etc.
- Schema has appropriate indexes on `userId`, `userId+createdAt`, `userId+isFavorite`, `userId+isPinned`.
- R2 file is deleted before DB row deletion in `deleteItem`, with graceful fail-open if R2 is unavailable.

**No dangerouslySetInnerHTML**
- No uses of `dangerouslySetInnerHTML` found anywhere in the codebase.

**Environment Files**
- `.gitignore` correctly excludes `.env*` — no environment files are committed.

**Tests**
- Well-written unit tests for `deleteItem`, `GET /api/items/[id]`, `GET /api/items/[id]/download`, and `POST /api/upload`.
- Tests cover auth, ownership, happy path, and error cases.
- External dependencies (Prisma, R2, auth) are properly mocked.

---

## Summary Table

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 4 |
| Medium | 6 |
| Low | 7 |
| **Total** | **18** |

**Overall Assessment:** The codebase is well-structured with good security fundamentals — Zod validation, bcrypt passwords, ownership checks in DB queries, scoped R2 keys, and rate limiting. The single most urgent issue is the inactive middleware (`src/proxy.ts` must be `src/middleware.ts`), which means route protection relies entirely on per-page server-side auth checks that currently lack redirects in the layout files. The header injection and the duplicate URL rendering in `ItemDrawer` are the next priority fixes. Performance issues are concentrated in sidebar and collection queries that can be improved with Prisma `_count` aggregates. Several code quality items (dead constant, duplicated helpers, duplicated `formatBytes`) are straightforward cleanup.
