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
- **Tablet is 768–1023px.** The navbar's link row needs about 1100px, so the header stays in its hamburger form below
  `xl` (1280px); never show the full link row earlier (it causes sideways scrolling). On tablet prefer two-up grids and
  side-by-side pairs (`md:`), and three-up / multi-column layouts from `lg:`. Two-up cards keep `PostCard compact` until `lg`.
  Every page must have no horizontal overflow at 390, 768, 1024 and 1280px.
- **Mobile is "below md" (768px).** Write mobile-first and revert at `md:`; never let a mobile-only change leak into
  tablet/desktop. Card grids are two-up on mobile (`grid-cols-2 gap-3`, `PostCard compact`), three-up on desktop.
- **Home hero on mobile** is tighter than the unit rule, on purpose: it follows the Reado mobile reference, with a little
  extra air (about 24 to 32px between the ticker, heading, paragraph, newsletter box and card). Those values are mobile-only
  (`md:` restores the normal spacing) and live in `app/page.tsx` and `components/NewsletterStamp.tsx`.
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
- `components/PageReveal.tsx` (mounted next to it) animates the page content in: the first screen rises as the curtain drains, and
  everything below the fold rises as it scrolls into view (an IntersectionObserver picks the moment, GSAP animates, once). It works on the direct children of `<main>`
  (a group of 2 to 12 children is split so its parts stagger), so new pages get it for free. Add `data-reveal="none"` to a block
  that has its own scroll-driven motion (StackSpread's wrapper), `data-reveal="whole"` to move a group as one piece; `.section-dark`
  blocks only fade. Content is hidden by script only after the page is covered, and reduced-motion users are never hidden anything.
- Don't reintroduce `components/Preloader.tsx` (the old language-cycling intro that got stuck opaque).

# Background components

Animated section backgrounds live in `components/ui`. Each fills its parent, so put it first inside a section that is
`relative overflow-hidden`, and give the content `relative z-10`. Keep them dark enough for white text (aim for 4.5:1).

- `halftone-dots.tsx` (`<HalftoneDots dotSize={16} />`): the **Watch** section, in its original grey and white. Zero dependencies.
  `dotSize` fixes the dot pitch in CSS px (without it the grid scales with the section, so tall sections get big dots);
  `colors={[bg, ...darkToLight]}` overrides the palette.
- `auralis.tsx` (`<Auralis colors={[...]} />`): the **FAQ** section's orange aurora.
- `neon-dither.tsx` (`<NeonDither color="#ef671c" intensity={0.6} />`): **unused, kept for later.** A dithered wave in any
  accent colour (needs `@paper-design/shaders-react`). It was Watch's background before the halftone dots.
- Site accents: orange `#ef671c` (dark shades `#c2470f`, `#7c2d12`) and yellow `#f0c808`.

# Membership application (`/join`)

A custom form (not an embedded Google Form) that ends up as a row in a **private** Google Sheet:
browser → server action (`app/join/actions.ts`) → Google Apps Script Web App (`apps-script/membership/Code.gs`) → sheet.
Setup, deployment, sheet permissions and troubleshooting: `apps-script/membership/README.md`.

- **One source of truth** for fields, options and validation: `lib/membership/application.ts` (zod). The browser, the server
  action and `Code.gs` all validate; when a question changes, update that file, `components/join/MembershipForm.tsx`, and
  `Code.gs` (`COLUMNS`, `validate_`, option lists) together.
- Needs two **server-only** env vars: `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` (never `NEXT_PUBLIC_`). The secret is what stops
  strangers who find the public `/exec` URL from writing to the sheet. Without them the form shows the friendly error state.
- Layout follows the spacing rules above: `.page-header`, then one section; each group is heading + `SectionDivider spaced` + fields;
  groups are separated by `gap-12 md:gap-16` (in-section scale). A sticky progress index shows from `lg`; single column below,
  two-up field pairs from `md`. Field controls live in `components/join/fields.tsx` (native radios/checkboxes styled as tiles).
- Anti-abuse: honeypot, minimum fill time, per-visitor rate limit, duplicate email/NIC/submission-id checks. Not a CAPTCHA.

The **newsletter** boxes (`/subscribe`, the footer, the home page's `NewsletterStamp`) share `components/subscribe/SubscribeForm.tsx`
(variants `page` / `stamp` / `footer`). They go through `app/subscribe/actions.ts` to the same Apps Script and land in the `Sheet2` tab.
A repeat sign-up shows success on purpose (no probing of who is subscribed). Shared server helpers (Apps Script call, visitor key,
rate limiter) live in `lib/apps-script.ts`. After changing `Code.gs`, redeploy it as a **new version** or the live URL keeps the old code.

# LYNX, the UOCA AI assistant

A floating chat (bottom-right on every public page, not `/admin`) that answers questions about UOCA from the live database.
Flow: `components/lynx/LynxWidget.tsx` → `POST /api/lynx` (`app/api/lynx/route.ts`: validates, rate-limits, streams NDJSON) →
`lib/lynx/gemini.ts` (the only file that talks to Gemini; a tool-calling loop) → `lib/lynx/tools.ts` → `lib/lynx/data.ts` (Prisma).

- **The database is the source of truth.** `lib/lynx/prompt.ts` holds behaviour rules only, no UOCA facts. Gemini calls tools
  (search_projects, get_project, list_events, search_articles, get_team, find_member, get_club_info…) and the server runs them
  against Prisma at question time, so anything an admin adds or changes is visible on the next question. Nothing is cached.
- **Public data only.** `data.ts` reads PUBLISHED projects/articles and active members, with explicit `select`s, so private member
  fields (email, phone, birthday, gender, relationship status, MyLCI ID, city) are never loaded. To expose a new field, add it to a
  `select` there. `EXPOSE_ARTICLE_PARTICIPANTS` switches participant names on or off. Project phase (upcoming/ongoing/completed) is
  computed in code from dates, never by the model.
- **Not in the database:** the About/how-to-join/contact copy and the site map live in `lib/lynx/site-info.ts` (mirrors the site's
  own copy; update it if that copy changes). There is no meeting/calendar table: meetings are article categories, events are
  articles with `eventDate`, and `/calendar` is still "Coming soon".
- **Links** the model writes are only rendered as links if a tool returned that path this turn (or it is a fixed page):
  `components/lynx/Markdown.tsx`. Invented URLs show as plain text.
- **Privacy:** conversations live only in the open tab (no storage, no logging of question text). Server-only env:
  `GEMINI_API_KEY`; optional `GEMINI_MODEL` (default `gemini-3.5-flash-lite`) and `GEMINI_THINKING_LEVEL`.
- **UI:** the launcher is the black-and-white blinking mascot from `components/ui/ask-ai.tsx` (tooltip and mascot from the
  "Ask AI" component; its links to other chatbots are deliberately left out). Opening it is **modal** (Radix Dialog in
  `LynxWidget.tsx`): the whole page is frosted (`backdrop-blur`) and can't be used, a card about a third of the screen wide sits on
  the right (a bottom sheet about 80% high on phones), and it closes only from its X or Esc, never by clicking the frost. Following a
  link inside the chat closes it so the destination is visible; the conversation is kept. Idle behaviour and speech bubbles:
  `LynxLauncher.tsx` and `useLynxBubble.ts` (bubble copy is invitations only, never facts). Any page can open the chat with
  `window.dispatchEvent(new CustomEvent("lynx:open", { detail: { prompt } }))` (see `/lynx`).
- Gemini's free tier has tight per-minute quotas (each question costs two model calls); enable billing before real traffic.
