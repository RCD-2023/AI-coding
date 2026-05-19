# Homepage Spec

## Overview

Replace the placeholder `app/page.tsx` with the full marketing homepage based on the prototype at `prototypes/homepage/`. The page is public (no auth required) and is the entry point for unauthenticated users.

## Route

`/` → `app/page.tsx`

## Component Structure

| File | Type | Responsibility |
|---|---|---|
| `app/page.tsx` | Server | Root page — composes all sections |
| `components/homepage/Navbar.tsx` | Client | Scroll class toggle, hamburger menu |
| `components/homepage/HeroSection.tsx` | Server | Layout, copy, hero visual wrapper |
| `components/homepage/ChaosAnimation.tsx` | Client | `requestAnimationFrame` particle system with cursor repulsion |
| `components/homepage/DashboardMockup.tsx` | Server | Static mini-dashboard visual (sidebar + cards) |
| `components/homepage/FeaturesSection.tsx` | Server | 6-card feature grid |
| `components/homepage/AiSection.tsx` | Server | Static code editor mockup + checklist |
| `components/homepage/PricingSection.tsx` | Server | Section wrapper, passes data to toggle |
| `components/homepage/PricingToggle.tsx` | Client | Monthly/yearly switch, updates displayed price |
| `components/homepage/CtaSection.tsx` | Server | Final call-to-action banner |
| `components/homepage/Footer.tsx` | Server | Logo, link columns, copyright year |
| `components/homepage/FadeIn.tsx` | Client | `IntersectionObserver` wrapper for scroll animations |

## Sections & Requirements

### Navbar
- Logo (code icon + "DevStash"), nav links: Features (`#features`), Pricing (`#pricing`)
- **Sign In** → `/sign-in`, **Get Started** → `/register`
- Adds a `scrolled` CSS class when `window.scrollY > 20` (background + shadow)
- Hamburger on mobile — toggles mobile menu open/closed; closes on link click
- Sticky, `z-50`

### Hero
- Eyebrow label, headline with gradient text span, subheadline paragraph
- Two CTAs: **Get Started Free** → `/register`, **See Features** → `#features` (smooth scroll)
- Visual: chaos panel (left) + arrow (center) + dashboard mockup (right)
- `ChaosAnimation` is a Client component — animated floating app icons (Notion, GitHub, Slack, VS Code, Browser, Terminal, File, Bookmark) that bounce and repel from cursor
- `DashboardMockup` is static JSX — mini sidebar + cards (see prototype for items)
- Fade-in on scroll via `FadeIn` client wrapper or CSS `@keyframes` + IntersectionObserver

### Features
- Section id: `features`
- 6 cards in a responsive grid (2 cols md, 3 cols lg): Code Snippets, AI Prompts, Instant Search, Commands, Files & Docs, Collections
- Each card has a colored icon (match prototype accent colors), heading, and description
- Use Lucide icons that match the type system: `Code2`, `Sparkles`, `Search`, `Terminal`, `FileText`, `FolderOpen`

### AI Section (Pro)
- Alternate background section
- Left: "Pro Feature" badge (use the `ProBadge` component if one exists, else a simple styled span), headline with gradient, 4 checklist items (auto-tagging, smart descriptions, semantic search, collection suggestions)
- Right: static code editor mockup styled to match the prototype (macOS traffic lights, filename, syntax-highlighted code block, AI tags panel)
- This is purely presentational — no interactivity

### Pricing
- Section id: `pricing`
- Monthly/yearly toggle: Client component `PricingToggle` that controls displayed price via state
  - Monthly: Pro = $8/mo
  - Yearly: Pro = $6/mo, show "Billed annually ($72/yr)" note, badge "Save 25%"
- Two cards: Free and Pro (highlighted/bordered)
  - Free: $0, feature list with ✓ / ✗ items, **Get Started Free** → `/register`
  - Pro "Most Popular": price driven by toggle, feature list, **Get Started with Pro** → `/register`
- Pro card features marked with accent color checks

### CTA
- Centered text + button: **Get Started Free — No Credit Card** → `/register`
- Alternate background

### Footer
- Logo + tagline
- 3 link columns: Product (Features `#features`, Pricing `#pricing`, Changelog `#`, Roadmap `#`), Resources (Documentation `#`, Blog `#`, API `#`, Status `#`), Company (About `#`, Privacy `#`, Terms `#`, Contact `#`)
- Copyright line with current year — render `new Date().getFullYear()` server-side, no client needed

## Styling Guidelines

- Use Tailwind v4 utility classes throughout — no custom CSS files
- Dark background matching the app: `bg-background` / `bg-card` for alternating sections
- Gradient text: `bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent`
- Buttons: use ShadCN `Button` with `variant="default"` (primary) and `variant="outline"` (ghost/outline)
- Feature/pricing cards: ShadCN `Card` or plain `div` with `border rounded-xl`
- Keep component files DRY — extract any repeated patterns (e.g. feature card, checklist item) as local sub-components or mapped data arrays within the same file

## Scroll Fade-In

Create a thin `FadeIn` client wrapper component (`components/homepage/FadeIn.tsx`) that uses `IntersectionObserver` to add a `visible` class. Use it to wrap section content that should animate in. CSS:

```css
.fade-in { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-in.visible { opacity: 1; transform: none; }
```

Add this to `globals.css` or inline via a `<style>` tag in the component.

## Links Summary

| Button / Link | Destination |
|---|---|
| Sign In | `/sign-in` |
| Get Started / Get Started Free | `/register` |
| Get Started with Pro | `/register` |
| Features (nav) | `#features` |
| Pricing (nav) | `#pricing` |
| See Features (hero) | `#features` |
| Footer product links | `#features`, `#pricing` |
| Changelog, Roadmap, Docs, Blog, etc. | `#` (placeholder) |

## References

- `prototypes/homepage/index.html` — full markup reference
- `prototypes/homepage/script.js` — JS behavior reference (chaos animation, pricing toggle, scroll effects)
- `context/project-overview.md` — type colors, feature list, pricing tiers
- `context/features/add-pro-badge-to-sidebar.md` — existing ProBadge component if applicable
