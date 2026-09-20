import Link from "next/link";
import {
  FolderKanban,
  FileText,
  Newspaper,
  CheckCircle2,
  PencilLine,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Projects", value: stats.totalProjects, icon: FolderKanban },
    { label: "Total Project Articles", value: stats.totalProjectArticles, icon: FileText },
    { label: "Total Blog Articles", value: stats.totalBlogArticles, icon: Newspaper },
    { label: "Published Articles", value: stats.publishedArticles, icon: CheckCircle2 },
    { label: "Draft Articles", value: stats.draftArticles, icon: PencilLine },
    { label: "Upcoming Projects", value: stats.upcomingProjects, icon: CalendarClock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of everything on the UOCA site.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentArticles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No articles yet.{" "}
              <Link href="/admin/articles" className="underline underline-offset-2">
                Create your first one
              </Link>{" "}
              once article management ships.
            </p>
          ) : (
            <ul className="divide-y">
              {stats.recentArticles.map((article) => (
                <li key={article.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.project ? article.project.name : "Blog"} ·{" "}
                      {article.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[article.status] ?? "outline"}>
                    {article.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
