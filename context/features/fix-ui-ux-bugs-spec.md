# UI/UX Bug Fixes Spec

Source: ui-reviewer agent audit of homepage and dashboard (2026-05-19).

---

## Priority 1 — Broken Functionality

### Fix 1 · DrawerActionBar — Copy button does nothing

**File:** `src/components/dashboard/DrawerActionBar.tsx`

The Copy `<Button>` at line 83 renders with no `onClick` handler, so pressing it has no effect.

**Fix:**
- Add `"use client"` directive to the file.
- Import `useState` and `Check` from their packages.
- Add local `copied` state.
- Implement `handleCopy`: write `item.content ?? item.url` to the clipboard, set `copied = true` for 1500 ms.
- Wire `onClick={handleCopy}` to the button.
- Swap the `Copy` icon for `Check` (green) while `copied` is true.
- Only render the button when `item.content ?? item.url` is truthy (same guard as `ItemCard`).

---

### Fix 2 · DashboardShell — No way to create collections on mobile

**File:** `src/components/dashboard/DashboardShell.tsx`

The "New Collection" button has `hidden md:flex`, leaving mobile users with no way to create a collection.

**Fix:**
- Import `FolderPlus` from lucide-react.
- Add an icon-only `<Button size="icon" className="h-8 w-8 md:hidden">` with `<FolderPlus>` that opens `createCollectionOpen`.
- Place it immediately before the existing mobile New Item icon button.

---

### Fix 3 · ItemCard — Copy button invisible on touch devices

**File:** `src/components/dashboard/ItemCard.tsx`

The copy button uses `opacity-0 group-hover:opacity-100`. Touch devices never fire hover, so the button is permanently invisible.

**Fix:**  
Change the button's opacity classes to `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` — always visible on mobile, hover-revealed on desktop.

---

## Priority 2 — Accessibility / Conversion

### Fix 4 · HeroSection + CtaSection — Missing gradient on headline

**Files:**
- `src/components/homepage/HeroSection.tsx` — `<span className="text-blue-500">Developer Knowledge</span>`
- `src/components/homepage/CtaSection.tsx` — `<span className="text-blue-500">Developer Knowledge?</span>`

Both use a flat `text-blue-500` while `AiSection.tsx` correctly uses a gradient.

**Fix:** Replace the `text-blue-500` class on both `<span>` elements with:
```
bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent
```

---

### Fix 5 · FadeIn — Above-fold content invisible before JS hydrates

**Files:**
- `src/components/homepage/FadeIn.tsx`
- `src/components/homepage/HeroSection.tsx`
- `src/app/globals.css`

The `.fade-in` CSS class sets `opacity: 0` before JS runs. The hero headline and CTA buttons are wrapped in `<FadeIn>`, making them invisible on first paint.

**Fix:**
- In `HeroSection.tsx`, remove the `<FadeIn>` wrapper from the text block (first child div). The visual panel block below can keep its `<FadeIn>`.
- Below-fold sections (FeaturesSection, AiSection, etc.) are unaffected and can keep `<FadeIn>`.

---

### Fix 6 · PricingToggle — Switch missing accessible label

**File:** `src/components/homepage/PricingToggle.tsx`

The `role="switch"` div has `aria-checked` but no `aria-labelledby` linking it to the visible "Monthly / Yearly" text labels. Screen readers announce it without a reliable name.

**Fix:**
- Add `id="pricing-label-monthly"` to the Monthly `<span>`.
- Add `id="pricing-label-yearly"` to the Yearly `<span>`.
- Add `aria-labelledby="pricing-label-monthly pricing-label-yearly"` to the switch `<div>`.

---

### Fix 7 · PricingToggle — "Save 25%" badge fails contrast

**File:** `src/components/homepage/PricingToggle.tsx` (line 66)

`text-green-400` on `bg-green-500/15` does not reach WCAG AA 4.5:1 for small text.

**Fix:** Change the badge classes from:
```
bg-green-500/15 text-green-400 border border-green-500/30
```
to:
```
bg-green-500/20 text-green-300 border border-green-500/50
```
`text-green-300` is lighter and achieves higher contrast against the near-black card background.

---

### Fix 8 · SignInForm — "Forgot password?" tap target too small

**File:** `src/components/auth/SignInForm.tsx`

The link has `text-xs` with no padding (~12 px tall) — well below the 44 px minimum.

**Fix:** Add `py-1 -my-1` to the link's `className` to expand the tap target without shifting layout.

---

### Fix 9 · SignInForm — Logo uses letter "S" instead of brand icon

**File:** `src/components/auth/SignInForm.tsx`

The header shows `<div>S</div>` while the Navbar and Footer both use `<Code2>` from lucide-react.

**Fix:**
- Import `Code2` from `lucide-react`.
- Replace the `S` div with `<Code2 className="h-5 w-5" />` inside the existing styled container.

---

### Fix 10 · SidebarContent — Chevron rotates left (wrong direction)

**File:** `src/components/dashboard/SidebarContent.tsx` (line 88)

When the Collections section is closed, `-rotate-90` rotates the chevron to the left. Convention is right (positive `rotate-90`) for a closed-pointing-down chevron.

**Fix:** Change `-rotate-90` to `rotate-90`.

---

## Priority 3 — Polish / Consistency

### Fix 11 · Footer — Dead placeholder links

**File:** `src/components/homepage/Footer.tsx`

Changelog, Roadmap, Documentation, Blog, API, Status, About, Contact, Privacy, Terms all link to `#`, which scrolls the page to the top — unexpected behaviour.

**Fix:** In the `LINKS` data array, change all `href: "#"` entries (everything except `#features` and `#pricing`) to `href: null`. In the JSX, render `null`-href items as `<span>` instead of `<a>` with `cursor-default text-muted-foreground/60`.

---

### Fix 12 · Navbar — Mobile "Sign In" has no tap target padding

**File:** `src/components/homepage/Navbar.tsx`

In the mobile menu, "Sign In" is a plain `<Link>` with `text-sm` and no padding — approximately 20 px tall.

**Fix:** Add `block py-2` to the Sign In link's className in the mobile menu block.

---

### Fix 13 · FeaturesSection — Card hover state imperceptible

**File:** `src/components/homepage/FeaturesSection.tsx`

`hover:border-border/80` shifts the border from 100 % to 80 % opacity — invisible on dark backgrounds.

**Fix:** Change the card's hover classes to `hover:border-border hover:bg-accent/5` — swap the opacity trick for a subtle background fill.

---

### Fix 14 · AiSection — "Pro Feature" badge uses wrong accent color

**File:** `src/components/homepage/AiSection.tsx` (line 28)

The badge uses `text-indigo-400 border-indigo-500/40 bg-indigo-500/10`, while every other accent on the page is `blue-500`.

**Fix:** Change to `text-blue-400 border-blue-500/40 bg-blue-500/10`.

---

### Fix 15 · SidebarContent — Duplicate Settings link

**File:** `src/components/dashboard/SidebarContent.tsx` (lines 192–197)

A standalone `<Link href="/settings">` gear icon sits next to the dropdown trigger, which already has a Settings menu item. This duplicates the link and the gear icon is only 28 × 28 px.

**Fix:** Remove the standalone gear icon `<Link>` entirely — settings remains accessible via the dropdown.

---

### Fix 16 · Dashboard page — Stat cards have no color differentiation

**File:** `src/app/dashboard/page.tsx`

All four stat card icons use `text-muted-foreground` on a grey `bg-muted` background — identical visual treatment for different metrics.

**Fix:** Add a `color` field to each stats entry and apply it to the icon container:
- Total Items → `text-blue-500 bg-blue-500/10`
- Collections → `text-green-500 bg-green-500/10`
- Favorite Items → `text-yellow-500 bg-yellow-500/10`
- Favorite Collections → `text-yellow-500 bg-yellow-500/10`

---

### Fix 17 · CollectionCard — 3-dot menu trigger is 24 × 24 px

**File:** `src/components/dashboard/CollectionCard.tsx` (line 82)

`h-6 w-6` (24 px) is too small for a reliable touch target, especially in the corner of a linked card.

**Fix:** Change to `h-8 w-8` (32 px).

---

### Fix 18 · ItemCard — Type badge contrast fails for "Command" (cyan)

**File:** `src/components/dashboard/ItemCard.tsx`

The type badge uses `variant="secondary"` (grey background) with `style={{ color }}`. The cyan Command color (`#06b6d4`) on grey secondary background is ~3.2:1 contrast — below the 4.5:1 AA threshold for small text.

**Fix:** Change `variant="secondary"` to `variant="outline"` for the type badge and add `style={{ color, borderColor: \`${color}60\` }}`. On the dark card background, outline badges give the colored text more contrast than the grey secondary background. The border reinforces the type color without a second indicator.

---

## Files Changed Summary

| File | Fixes |
|------|-------|
| `src/components/dashboard/DrawerActionBar.tsx` | 1 |
| `src/components/dashboard/DashboardShell.tsx` | 2 |
| `src/components/dashboard/ItemCard.tsx` | 3, 18 |
| `src/components/homepage/HeroSection.tsx` | 4, 5 |
| `src/components/homepage/CtaSection.tsx` | 4 |
| `src/components/homepage/PricingToggle.tsx` | 6, 7 |
| `src/components/auth/SignInForm.tsx` | 8, 9 |
| `src/components/dashboard/SidebarContent.tsx` | 10, 15 |
| `src/components/homepage/Footer.tsx` | 11 |
| `src/components/homepage/Navbar.tsx` | 12 |
| `src/components/homepage/FeaturesSection.tsx` | 13 |
| `src/components/homepage/AiSection.tsx` | 14 |
| `src/app/dashboard/page.tsx` | 16 |
| `src/components/dashboard/CollectionCard.tsx` | 17 |
