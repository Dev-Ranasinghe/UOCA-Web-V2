import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../../../articles/article-form";
import type { ExternalLinkEntry } from "@/components/admin/external-links-editor";

export default async function EditProjectArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [article, projects, locations, media] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        featuredImage: true,
        tags: { include: { tag: true } },
        authors: { include: { member: true }, orderBy: { sortOrder: "asc" } },
        participants: { include: { member: true } },
      },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, url: true, fileName: true, mimeType: true },
    }),
  ]);

  if (!article || !article.projectId) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
        <p className="text-sm text-muted-foreground">Edit this article&apos;s details.</p>
      </div>
      <ArticleForm
        mode="project"
        listPath="/admin/project-articles"
        article={article}
        featuredImage={article.featuredImage}
        projects={projects}
        locations={locations}
        media={media}
        authors={article.authors.map((a) => ({
          memberId: a.memberId,
          displayName: a.member.displayName,
        }))}
        participants={article.participants.map((p) => ({
          memberId: p.memberId,
          displayName: p.member.displayName,
        }))}
        externalLinks={(article.externalLinks as ExternalLinkEntry[] | null) ?? []}
        tagsValue={article.tags.map((t) => t.tag.name).join(", ")}
      />
    </div>
  );
}
