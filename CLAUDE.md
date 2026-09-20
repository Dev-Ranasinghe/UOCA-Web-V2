@AGENTS.md

# Spacing & alignment (applies to every public page and section)

The site runs on **one vertical unit**, `--section-gap`, defined in `app/globals.css`:
**88px mobile / 128px tablet (md) / 176px desktop (lg)**, measured from the Reado reference screenshots.
`--section-gap-half` is half of it. Never invent per-section margins; use these.

**Page skeleton (inner pages):**

```tsx
<main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
  <div className="page-header text-center ...">title (+ filters/breadcrumb)</div>
  <section>…</section>          {/* every following child sits one unit below the previous */}
</main>
<Footer />                      {/* Footer adds its own one-unit gap above the banner */}
```

- Space **between sections** is set only by `.section-stack` (one unit). Do not put `my-*`, `mb-*`, `mt-*`,
  `space-y-*` or `pb-*` on a section to separate it from its neighbours.
- The **first child after a `.page-header`** is half a unit below it. Filters/breadcrumbs belong inside the header.
- **Full-width dark sections** get `className="section-dark ..."`: padding top and bottom = one unit, and they
  sit one unit from light neighbours. Two dark sections in a row touch (no extra gap).
- **Inside a section**: heading, then `<SectionDivider spaced />` (`dark` on black), then content. `spaced` applies
  `--divider-gap` above and below the line: 20px below md, 32px from md up (measured from the mobile reference).
  Small in-section spacing uses the 4/8px scale (`gap-6`, `mb-4`, `mt-8`), never one-off values.
- **Mobile is "below md" (768px).** Write mobile-first and revert at `md:`; never let a mobile-only change leak into
  tablet/desktop. Card grids are two-up on mobile (`grid-cols-2 gap-3`, `PostCard compact`), three-up on desktop.
- **Horizontal alignment**: use `page-container` (max 80rem; 16 / 24 / 32px side padding at base / sm / lg) so all
  section edges line up between pages. Narrower pages add a `max-w-*` utility next to it (e.g. `max-w-6xl`).
- Section components must not set their own outer margins; the page decides spacing. Centered single-card pages
  (ComingSoon, subscribe) use `pt-[var(--section-gap-half)]` and rely on the Footer for the bottom gap.
- Admin (`app/admin`) is a dashboard, not marketing pages, and is out of scope for these rules.

# Page transitions

`components/PageTransition.tsx` (mounted once in `app/layout.tsx`) plays the black "waterfall" curtain on first load and on every
internal page change: black falls from the top to cover, the route changes underneath, then it drains off the bottom
(gsap, same wipe as the mobile menu). Notes for future work:

- Plain `<Link>`/`<a href="/x">` clicks get it automatically. Query-only and hash-only links (filters, anchors), modified
  clicks, external links and `target="_blank"` are left alone. Add `data-no-transition` to an `<a>` to opt out.
- The admin dashboard (`/admin`) is excluded, and reduced-motion users never see the curtain.
- It must never be able to strand the page covered: keep the CSS failsafe in `globals.css`, the `noscript` rule and the
  real-time watchdogs when changing it. Timings live in constants at the top of the file.
- Don't reintroduce `components/Preloader.tsx` (the old language-cycling intro that got stuck opaque).
