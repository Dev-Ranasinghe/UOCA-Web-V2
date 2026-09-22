import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderKanban,
  FolderPlus,
  ImagePlus,
  Newspaper,
  PencilLine,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { PixelField } from "@/components/admin/pixel-field";
import { RevealGroup, RevealItem } from "@/components/admin/reveal";
import { requireAdmin } from "@/lib/auth/dal";
import { readMaintenanceMode } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const now = new Date();

  const [
    totalProjects,
    totalProjectArticles,
    totalBlogArticles,
    publishedArticles,
    draftArticles,
    upcomingProjects,
    recentArticles,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.article.count({ where: { projectId: { not: null } } }),
    prisma.article.count({ where: { projectId: null } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.project.count({
      where: { status: "PUBLISHED", startDate: { gt: now } },
    }),
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        projectId: true,
        project: { select: { name: true } },
      },
    }),
  ]);

  return {
    totalProjects,
    totalProjectArticles,
    totalBlogArticles,
    publishedArticles,
    draftArticles,
    upcomingProjects,
    recentArticles,
  };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const SHORTCUTS: { title: string; note: string; href: string; icon: LucideIcon; fill: string }[] = [
  { title: "Start a project", note: "A new service project page", href: "/admin/projects/new", icon: FolderPlus, fill: "bg-(--nb-yellow)" },
  { title: "Write an article", note: "Blog post, news or a recap", href: "/admin/articles/new", icon: PenLine, fill: "bg-(--nb-purple)" },
  { title: "Upload media", note: "Photos for articles and projects", href: "/admin/media", icon: ImagePlus, fill: "bg-(--nb-green)" },
];

// Quick jumps, drawn as the reference's ribbon tags (see the Badge rules in admin-theme.css).
const SECTIONS = [
  { label: "Projects", href: "/admin/projects", tone: "yellow", notch: "none" },
  { label: "Project articles", href: "/admin/project-articles", tone: "purple", notch: "start" },
  { label: "Blog", href: "/admin/articles", tone: "blue", notch: "none" },
  { label: "Members", href: "/admin/members", tone: "green", notch: "end" },
  { label: "Media", href: "/admin/media", tone: "pink", notch: "start" },
  { label: "Categories", href: "/admin/categories", tone: "green", notch: "start" },
];

export default async function AdminOverviewPage() {
  const [admin, stats, maintenance] = await Promise.all([
    requireAdmin(),
    getStats(),
    readMaintenanceMode().catch(() => false),
  ]);
  const firstName = admin.displayName.trim().split(/\s+/)[0] || "there";

  const headline =
    stats.draftArticles > 0
      ? `Hi ${firstName}. ${plural(stats.draftArticles, "draft")} ${stats.draftArticles === 1 ? "is" : "are"} waiting, and ${plural(stats.publishedArticles, "article")} ${stats.publishedArticles === 1 ? "is" : "are"} live on the site.`
      : `Hi ${firstName}. Nothing is waiting: ${plural(stats.publishedArticles, "article")} ${stats.publishedArticles === 1 ? "is" : "are"} live on the site.`;

  const tiles: { label: string; value: number; note: string; icon: LucideIcon }[] = [
    { label: "Projects", value: stats.totalProjects, note: "Every project page, any status.", icon: FolderKanban },
    { label: "Project articles", value: stats.totalProjectArticles, note: "Write-ups attached to a project.", icon: FileText },
    { label: "Blog articles", value: stats.totalBlogArticles, note: "Standalone posts and news.", icon: Newspaper },
    { label: "Published", value: stats.publishedArticles, note: "Articles visitors can read now.", icon: CheckCircle2 },
    { label: "Drafts", value: stats.draftArticles, note: "Hidden until you publish them.", icon: PencilLine },
    { label: "Upcoming projects", value: stats.upcomingProjects, note: "Published, starting later.", icon: CalendarClock },
  ];

  return (
    <RevealGroup className="space-y-5 md:space-y-6">
      <h1 className="sr-only">Dashboard</h1>

      {/* Shortcuts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SHORTCUTS.map((s, i) => (
          <RevealItem key={s.href} order={i} className={i === SHORTCUTS.length - 1 ? "md:col-span-2 xl:col-span-1" : undefined}>
            <Link
              href={s.href}
              data-nb-plain
              className="group flex items-center gap-4 rounded-(--nb-radius) border-2 border-(color:--nb-ink) bg-white p-3 pr-5 shadow-(--nb-shadow) transition-[translate,box-shadow] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--nb-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--nb-ink)] md:p-4"
            >
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-(color:--nb-ink) md:size-14 ${s.fill}`}>
                <s.icon className="size-6" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{s.title}</span>
                <span className="block truncate text-sm text-(color:--nb-muted)">{s.note}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          </RevealItem>
        ))}
      </div>

      {/* Welcome + stats */}
      <RevealItem order={3}>
        <section className="rounded-[22px] border-2 border-(color:--nb-ink) bg-white p-4 shadow-(--nb-shadow) sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10">
            <div className="flex flex-col gap-6 lg:justify-between lg:py-2">
              <p className="max-w-[24ch] text-[1.65rem] leading-[1.12] font-medium tracking-[-0.025em] text-balance sm:text-[2rem] lg:text-[2.6rem]">
                {headline}
              </p>
              <nav aria-label="Sections" className="flex flex-wrap gap-x-3 gap-y-3">
                {SECTIONS.map((s) => (
                  <Badge
                    key={s.href}
                    variant="outline"
                    data-tone={s.tone}
                    data-notch={s.notch}
                    data-size="lg"
                    render={<Link href={s.href} />}
                  >
                    {s.label}
                  </Badge>
                ))}
              </nav>
            </div>

            <Link
              href="/admin/settings"
              data-nb-plain
              className="group flex items-center gap-4 rounded-2xl border-2 border-(color:--nb-ink) bg-(--nb-blush) p-3 shadow-(--nb-shadow) transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--nb-ink)] lg:flex-col lg:items-stretch lg:p-4"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-(color:--nb-ink) bg-(--nb-ink) sm:size-24 lg:aspect-square lg:size-auto lg:w-full">
                <PixelField mood={maintenance ? "maintenance" : "live"} className="absolute inset-0 size-full" />
              </div>
              <div className="min-w-0">
                <p className="font-bold">The site is</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 bg-white px-1.5 py-0.5 font-mono text-sm">
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ${maintenance ? "bg-(--nb-danger)" : "bg-(--nb-green) motion-safe:animate-pulse"}`}
                  />
                  {maintenance ? "in maintenance" : "live"}
                </p>
                <p className="mt-2 text-xs text-(color:--nb-muted) group-hover:underline">Change in settings</p>
              </div>
            </Link>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:mt-10">
            {tiles.map((tile) => (
              <li
                key={tile.label}
                className="flex flex-col rounded-2xl border-2 border-(color:--nb-ink) bg-white p-3 shadow-(--nb-shadow-sm) sm:p-5"
              >
                <span className="mb-4 flex size-10 items-center justify-center rounded-full border-2 border-(color:--nb-ink) sm:mb-6 sm:size-11">
                  <tile.icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-bold">{tile.label}</span>
                <span className="tabular mt-1 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-[2rem]">
                  {tile.value}
                </span>
                <span className="mt-2 hidden text-sm text-(color:--nb-muted) sm:block">{tile.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </RevealItem>

      {/* Recent articles */}
      <RevealItem order={4}>
        <section className="rounded-[22px] border-2 border-(color:--nb-ink) bg-white shadow-(--nb-shadow)">
          <div className="flex items-center justify-between gap-4 border-b-2 border-(color:--nb-ink) px-4 py-4 sm:px-6">
            <h2 className="text-lg font-bold tracking-[-0.01em]">Recent articles</h2>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href="/admin/articles">
                  All articles <ArrowUpRight />
                </Link>
              }
            />
          </div>
          {stats.recentArticles.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-(color:--nb-muted)">
              No articles yet.{" "}
              <Link href="/admin/articles/new" className="font-bold text-(color:--nb-ink) underline">
                Write the first one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-[rgb(22_22_22/0.1)]">
              {stats.recentArticles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/${article.projectId ? "project-articles" : "articles"}/${article.id}/edit`}
                    data-nb-plain
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-(--nb-lavender) sm:gap-4 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{article.title}</p>
                      <p className="truncate text-sm text-(color:--nb-muted)">
                        {article.project ? article.project.name : "Blog"} ·{" "}
                        {article.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <StatusBadge status={article.status} />
                    <ArrowRight className="hidden size-4 shrink-0 transition-transform group-hover:translate-x-1 sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </RevealItem>
    </RevealGroup>
  );
}
