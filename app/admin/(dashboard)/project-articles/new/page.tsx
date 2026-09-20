import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../../articles/article-form";

export default async function NewProjectArticlePage() {
  await requireAdmin();

  const [projects, locations, media] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, url: true, fileName: true, mimeType: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project article</h1>
        <p className="text-sm text-muted-foreground">
          A session, report, or update attached to a specific project.
        </p>
      </div>
      <ArticleForm
        mode="project"
        listPath="/admin/project-articles"
        projects={projects}
        locations={locations}
        media={media}
        authors={[]}
        participants={[]}
        externalLinks={[]}
        tagsValue=""
      />
    </div>
  );
}
