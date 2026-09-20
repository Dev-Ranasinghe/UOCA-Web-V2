import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../article-form";

export default async function NewBlogArticlePage() {
  await requireAdmin();

  const [categories, locations, media] = await Promise.all([
    prisma.category.findMany({
      where: { kind: { in: ["BLOG", "GENERAL"] } },
      orderBy: { name: "asc" },
    }),
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
        <h1 className="text-2xl font-semibold tracking-tight">New blog article</h1>
        <p className="text-sm text-muted-foreground">
          General content not tied to a specific project.
        </p>
      </div>
      <ArticleForm
        mode="blog"
        listPath="/admin/articles"
        categories={categories}
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
