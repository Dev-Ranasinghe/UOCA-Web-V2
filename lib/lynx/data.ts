import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * LYNX's read-only window onto the UOCA database.
 *
 * Rules that keep it safe:
 *  - It only ever reads what the public website itself shows: PUBLISHED projects and articles, active members.
 *  - Every query names its columns with `select`, so private member fields (email, phone, birthday, gender,
 *    relationship status, MyLCI ID, city) are never even loaded, let alone sent to the model.
 *  - There is no free-form query. The model can only call the functions in lib/lynx/tools.ts, which call these.
 *  - Nothing is cached or copied: every question reads the database as it is right now, so anything an admin adds
 *    or changes in the dashboard is visible to LYNX on the next question.
 */

/** Article participants are shown to the model by display name and role. Set to false to keep them private. */
const EXPOSE_ARTICLE_PARTICIPANTS = true;

const SITE_TIME_ZONE = "Asia/Colombo";
const MAX_TEXT_CHARS = 1800;

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────

/** Today in Sri Lanka as YYYY-MM-DD. */
export function todayInColombo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE }).format(new Date());
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** How the website itself shows project dates: month and year only. */
function monthYear(d: Date | null): string | null {
  return d ? d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : null;
}

export type ProjectPhase = "upcoming" | "ongoing" | "completed" | "started (end date not published)" | "dates not published";

/** Computed here, from the dates and today's date, so the model never has to work it out. */
export function projectPhase(start: Date | null, end: Date | null, today = todayInColombo()): ProjectPhase {
  if (!start && !end) return "dates not published";
  if (start && isoDay(start) > today) return "upcoming";
  if (end && isoDay(end) < today) return "completed";
  if (end) return "ongoing";
  return "started (end date not published)";
}

function tiptapToText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  const inner = Array.isArray(n.content) ? n.content.map(tiptapToText).join("") : "";
  const own = n.text ?? "";
  const block = ["paragraph", "heading", "listItem", "blockquote", "codeBlock"].includes(n.type ?? "");
  return own + inner + (block ? "\n" : "");
}

function articleText(content: unknown): string {
  return tiptapToText(content).replace(/\n{2,}/g, "\n").trim();
}

function tokens(query: string | undefined): string[] {
  if (!query) return [];
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3),
    ),
  ).slice(0, 6);
}

function snippet(text: string, terms: string[], length = 320): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const at = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, at - 80);
  return (start > 0 ? "…" : "") + text.slice(start, start + length).trim() + (start + length < text.length ? "…" : "");
}

const memberLink = (id: string) => `/leo-id?member=${id}`;
const articleUrl = (slug: string, projectSlug: string | null | undefined) =>
  projectSlug ? `/projects/${projectSlug}#${slug}` : `/blog/${slug}`;

const CATEGORY_LABEL = { EXCO: "EXCO", HEAD: "Head", DIRECTOR: "Director" } as const;

// ── projects ────────────────────────────────────────────────────────────────────────────────────

const personSelect = { select: { id: true, displayName: true, fullName: true } } as const;

const projectSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  startDate: true,
  endDate: true,
  chairperson: personSelect,
  secretary: personSelect,
  treasurer: personSelect,
  tags: { select: { tag: { select: { name: true } } } },
  _count: { select: { articles: { where: { status: "PUBLISHED" as const } } } },
} satisfies Prisma.ProjectSelect;

type ProjectRow = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

function person(p: { id: string; displayName: string; fullName: string } | null) {
  return p ? { name: p.displayName, fullName: p.fullName, url: memberLink(p.id) } : null;
}

function shapeProject(p: ProjectRow) {
  return {
    name: p.name,
    url: `/projects/${p.slug}`,
    summary: p.shortDescription,
    phase: projectPhase(p.startDate, p.endDate),
    starts: monthYear(p.startDate),
    ends: monthYear(p.endDate),
    chairperson: person(p.chairperson),
    secretary: person(p.secretary),
    treasurer: person(p.treasurer),
    tags: p.tags.map((t) => t.tag.name),
    publishedArticles: p._count.articles,
  };
}

export async function searchProjects(args: { query?: string; phase?: "upcoming" | "ongoing" | "completed" | "all"; limit?: number }) {
  const terms = tokens(args.query);
  const rows = await prisma.project.findMany({
    where: {
      status: "PUBLISHED",
      ...(terms.length
        ? {
            OR: terms.flatMap((t) => [
              { name: { contains: t, mode: "insensitive" as const } },
              { shortDescription: { contains: t, mode: "insensitive" as const } },
              { tags: { some: { tag: { name: { contains: t, mode: "insensitive" as const } } } } },
              {
                articles: {
                  some: {
                    status: "PUBLISHED" as const,
                    OR: [
                      { title: { contains: t, mode: "insensitive" as const } },
                      { excerpt: { contains: t, mode: "insensitive" as const } },
                    ],
                  },
                },
              },
            ]),
          }
        : {}),
    },
    select: projectSelect,
    orderBy: { startDate: "desc" },
    take: 50,
  });

  const wanted = args.phase && args.phase !== "all" ? args.phase : null;
  const projects = rows
    .map(shapeProject)
    .filter((p) => !wanted || p.phase === wanted || (wanted === "ongoing" && p.phase === "started (end date not published)"));

  const limit = args.limit ?? 8;
  return {
    today: todayInColombo(),
    count: projects.length,
    projects: projects.slice(0, limit),
    // Asked for a phase that has no projects (say, "ongoing")? Hand back what does exist, grouped by phase, so the
    // answer can say "none right now, but X is upcoming" instead of a bare "none".
    ...(wanted && projects.length === 0
      ? {
          note: `No published projects are currently ${wanted}. Here are the projects that do exist, with their phase.`,
          otherProjects: rows.map(shapeProject).slice(0, limit),
        }
      : {}),
  };
}

export async function getProject(args: { name: string }) {
  const needle = args.name.trim();
  const rows = await prisma.project.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { slug: needle.toLowerCase().replace(/\s+/g, "-") },
        { name: { contains: needle, mode: "insensitive" } },
      ],
    },
    select: {
      ...projectSelect,
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          slug: true,
          title: true,
          subtitle: true,
          excerpt: true,
          content: true,
          publishedAt: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          location: { select: { name: true, city: true } },
          authors: { select: { member: { select: { displayName: true } } }, orderBy: { sortOrder: "asc" } },
          participants: { select: { role: true, member: { select: { displayName: true } } } },
        },
      },
    },
    take: 3,
  });

  if (rows.length === 0) return { found: false as const, note: "No published project matches that name." };
  // An exact name or slug beats a partial match.
  const best = rows.find((r) => r.name.toLowerCase() === needle.toLowerCase() || r.slug === needle.toLowerCase()) ?? rows[0];
  const others = rows.filter((r) => r !== best).map((r) => ({ name: r.name, url: `/projects/${r.slug}` }));

  return {
    found: true as const,
    ...shapeProject(best),
    otherMatches: others,
    articles: best.articles.map((a, i) => ({
      title: a.title,
      subtitle: a.subtitle,
      url: articleUrl(a.slug, best.slug),
      published: a.publishedAt ? isoDay(a.publishedAt) : null,
      eventDate: a.eventDate ? isoDay(a.eventDate) : null,
      startTime: a.startTime,
      endTime: a.endTime,
      location: a.location ? [a.location.name, a.location.city].filter(Boolean).join(", ") : null,
      writtenBy: a.authors.map((x) => x.member.displayName),
      participants: EXPOSE_ARTICLE_PARTICIPANTS ? a.participants.map((x) => ({ name: x.member.displayName, role: x.role })) : undefined,
      excerpt: a.excerpt,
      // Only the newest few articles include body text, to keep the answer grounded without flooding the model.
      text: i < 3 ? articleText(a.content).slice(0, MAX_TEXT_CHARS) : undefined,
    })),
  };
}

// ── events, meetings and articles ───────────────────────────────────────────────────────────────

const articleListSelect = {
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  publishedAt: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  category: { select: { name: true } },
  project: { select: { slug: true, name: true } },
  location: { select: { name: true, city: true } },
  authors: { select: { member: { select: { displayName: true } } }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ArticleSelect;

type ArticleListRow = Prisma.ArticleGetPayload<{ select: typeof articleListSelect }>;

function shapeArticle(a: ArticleListRow, extra: Record<string, unknown> = {}) {
  return {
    title: a.title,
    subtitle: a.subtitle,
    url: articleUrl(a.slug, a.project?.slug),
    category: a.category?.name ?? null,
    published: a.publishedAt ? isoDay(a.publishedAt) : null,
    eventDate: a.eventDate ? isoDay(a.eventDate) : null,
    startTime: a.startTime,
    endTime: a.endTime,
    location: a.location ? [a.location.name, a.location.city].filter(Boolean).join(", ") : null,
    project: a.project ? { name: a.project.name, url: `/projects/${a.project.slug}` } : null,
    writtenBy: a.authors.map((x) => x.member.displayName),
    excerpt: a.excerpt,
    ...extra,
  };
}

/** Events and meetings are articles that have an event date. Meeting types are article categories. */
export async function listEvents(args: { when?: "upcoming" | "past" | "all"; category?: string; limit?: number }) {
  const today = todayInColombo();
  const when = args.when ?? "upcoming";
  const rows = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      eventDate: when === "all" ? { not: null } : when === "upcoming" ? { gte: new Date(`${today}T00:00:00Z`) } : { lt: new Date(`${today}T00:00:00Z`) },
      ...(args.category ? { category: { name: { contains: args.category, mode: "insensitive" as const } } } : {}),
    },
    select: articleListSelect,
    orderBy: { eventDate: when === "upcoming" ? "asc" : "desc" },
    take: args.limit ?? 8,
  });

  return {
    today,
    when,
    count: rows.length,
    events: rows.map((a) => shapeArticle(a)),
    note:
      rows.length === 0
        ? "No published events with a date match. The website's calendar page is not live yet, so there is no other schedule to check."
        : undefined,
  };
}

/** Lists the article categories (meeting and event types) so the model can filter correctly. */
export async function listArticleCategories() {
  const rows = await prisma.category.findMany({
    where: { kind: { in: ["BLOG", "GENERAL"] } },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return rows.map((c) => ({ name: c.name, url: `/blog?category=${c.slug}` }));
}

export async function searchArticles(args: { query?: string; category?: string; limit?: number }) {
  const terms = tokens(args.query);
  const limit = args.limit ?? 6;
  const categoryFilter = args.category ? { category: { name: { contains: args.category, mode: "insensitive" as const } } } : {};

  const byMetadata = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      ...categoryFilter,
      ...(terms.length
        ? {
            OR: terms.flatMap((t) => [
              { title: { contains: t, mode: "insensitive" as const } },
              { subtitle: { contains: t, mode: "insensitive" as const } },
              { excerpt: { contains: t, mode: "insensitive" as const } },
              { tags: { some: { tag: { name: { contains: t, mode: "insensitive" as const } } } } },
              { project: { name: { contains: t, mode: "insensitive" as const } } },
            ]),
          }
        : {}),
    },
    select: articleListSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  const results = byMetadata.map((a) => shapeArticle(a));

  // Article bodies are stored as rich-text JSON the database can't search, so fall back to reading recent bodies here.
  if (terms.length && results.length < limit) {
    const seen = new Set(byMetadata.map((a) => a.slug));
    const recent = await prisma.article.findMany({
      where: { status: "PUBLISHED", ...categoryFilter },
      select: { ...articleListSelect, content: true },
      orderBy: { publishedAt: "desc" },
      take: 60,
    });
    for (const a of recent) {
      if (results.length >= limit) break;
      if (seen.has(a.slug)) continue;
      const text = articleText(a.content);
      if (terms.some((t) => text.toLowerCase().includes(t))) {
        const { content: _content, ...rest } = a;
        void _content;
        results.push(shapeArticle(rest, { matchingText: snippet(text, terms) }));
      }
    }
  }

  return { count: results.length, articles: results };
}

export async function getArticle(args: { title: string }) {
  const needle = args.title.trim();
  const a = await prisma.article.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [{ slug: needle.toLowerCase().replace(/\s+/g, "-") }, { title: { contains: needle, mode: "insensitive" } }],
    },
    select: {
      ...articleListSelect,
      content: true,
      participants: { select: { role: true, member: { select: { displayName: true } } } },
    },
    orderBy: { publishedAt: "desc" },
  });
  if (!a) return { found: false as const, note: "No published article matches that title." };

  const { content, participants, ...rest } = a;
  return {
    found: true as const,
    ...shapeArticle(rest),
    participants: EXPOSE_ARTICLE_PARTICIPANTS ? participants.map((x) => ({ name: x.member.displayName, role: x.role })) : undefined,
    text: articleText(content).slice(0, MAX_TEXT_CHARS * 2),
  };
}

// ── people (only what the public Team and UOCA ID pages show) ───────────────────────────────────

export async function getTeam(args: { category?: "EXCO" | "HEAD" | "DIRECTOR" }) {
  const rows = await prisma.member.findMany({
    where: { isTeamMember: true, isActive: true, ...(args.category ? { teamCategory: args.category } : {}) },
    select: { id: true, displayName: true, fullName: true, clubRole: true, leoDesignation: true, teamCategory: true, teamSortOrder: true },
    orderBy: [{ teamCategory: "asc" }, { teamSortOrder: "asc" }],
  });
  const order = { EXCO: 0, HEAD: 1, DIRECTOR: 2 } as const;
  rows.sort((a, b) => (order[a.teamCategory ?? "DIRECTOR"] - order[b.teamCategory ?? "DIRECTOR"]) || a.teamSortOrder - b.teamSortOrder);
  return {
    count: rows.length,
    teamPage: "/team",
    members: rows.map((m) => ({
      name: m.displayName,
      fullName: m.fullName,
      role: m.clubRole,
      designation: m.leoDesignation,
      team: m.teamCategory ? CATEGORY_LABEL[m.teamCategory] : null,
      url: memberLink(m.id),
    })),
  };
}

export async function findMember(args: { name: string }) {
  const needle = args.name.trim();
  const rows = await prisma.member.findMany({
    where: {
      isActive: true,
      OR: [
        { fullName: { contains: needle, mode: "insensitive" } },
        { displayName: { contains: needle, mode: "insensitive" } },
        { clubRole: { contains: needle, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      displayName: true,
      fullName: true,
      clubRole: true,
      leoDesignation: true,
      teamCategory: true,
      bio: true,
      isNewLeo: true,
      leoExperience: true,
      chairedProjects: { where: { status: "PUBLISHED" }, select: { slug: true, name: true } },
      secretaryProjects: { where: { status: "PUBLISHED" }, select: { slug: true, name: true } },
      treasurerProjects: { where: { status: "PUBLISHED" }, select: { slug: true, name: true } },
    },
    take: 5,
  });

  const project = (p: { slug: string; name: string }, role: string) => ({ role, name: p.name, url: `/projects/${p.slug}` });
  return {
    count: rows.length,
    members: rows.map((m) => ({
      name: m.displayName,
      fullName: m.fullName,
      role: m.clubRole,
      designation: m.leoDesignation,
      team: m.teamCategory ? CATEGORY_LABEL[m.teamCategory] : null,
      about: m.bio,
      leoStatus: m.isNewLeo ? "New Leo" : (m.leoExperience ?? "Experienced Leo"),
      projects: [
        ...m.chairedProjects.map((p) => project(p, "Chairperson")),
        ...m.secretaryProjects.map((p) => project(p, "Secretary")),
        ...m.treasurerProjects.map((p) => project(p, "Treasurer")),
      ],
      url: memberLink(m.id),
    })),
  };
}
