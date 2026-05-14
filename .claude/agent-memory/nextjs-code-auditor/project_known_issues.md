---
name: project-known-issues
description: Known issues identified in the 2026-05-14 full codebase audit (CODE_SCAN.md)
metadata:
  type: project
---

Issues identified in the 2026-05-14 audit at `docs/audit-results/CODE_SCAN.md`. Do NOT re-report these unless verifying they are still present.

**CRITICAL (open):**
- `src/proxy.ts` is the middleware file but is named wrong — Next.js never executes it. Must be renamed to `src/middleware.ts` and the default export changed.

**HIGH (open):**
- Header injection: `Content-Disposition` in `src/app/api/items/[id]/download/route.ts` (line 42) and `src/app/api/upload/route.ts` (line 88) interpolates `fileName` without sanitizing quotes/newlines.
- N+1: `getItemsByTypeSlug` and `createItem` both call `prisma.itemType.findMany({ where: { isSystem: true } })` and filter in JS instead of querying by name directly.
- Over-fetch: `getItemTypesForSidebar` includes all item IDs to count in JS — should use `_count` aggregate.
- Over-fetch: `getCollectionsForSidebar` and `getCollectionsForUser` include full Item+ItemType rows to compute dominant color — should select minimally.

**MEDIUM (open):**
- Dashboard and items layouts do not redirect on unauthenticated session — only profile page does.
- `src/lib/constants.ts` contains dead `DEMO_USER_EMAIL` constant — auth is now wired up, this is unused.
- `ItemDrawer` has a view-mode logic bug: URL renders twice on link items (line ~441-497).
- Register route does not check minimum password length (8 chars) — reset-password does.
- `usePasswordResetToken` has a narrow TOCTOU race — findFirst + delete are not atomic.
- `ItemDrawer` fetch in useEffect swallows errors silently — no user feedback on failure.

**LOW (open):**
- `createItem` action fetches all system types to find one — should query by name.
- `UserAvatar`, `ImageThumbnailCard`, `ItemDrawer` use `<img>` instead of Next.js `<Image>`.
- `ItemDrawer` is 614 lines — decomposition opportunity (useItemDrawer hook, sub-components).
- `fieldLabel` + `FieldError` helpers duplicated in CreateItemDialog and ItemDrawer.
- `formatBytes` duplicated in ItemDrawer, FileUpload, FileListRow — should be in src/lib/utils.ts.
- `DeleteAccountDialog` has no typed confirmation gate for irreversible action.
- Sidebar silently truncates recent collections at 5 with no UI indicator.

**Why:** These were confirmed by reading the actual source files on 2026-05-14.
**How to apply:** When asked about these files, check if the issues are still present before reporting. When writing fixes, address these known issues first.
