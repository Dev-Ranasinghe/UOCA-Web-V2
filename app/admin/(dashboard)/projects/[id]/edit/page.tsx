import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "../../project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [project, media] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        coverImage: true,
        chairperson: true,
        secretary: true,
        treasurer: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, url: true, fileName: true, mimeType: true },
    }),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">Edit this project&apos;s details.</p>
      </div>
      <ProjectForm
        project={project}
        coverImage={project.coverImage}
        media={media}
        chairperson={project.chairperson}
        secretary={project.secretary}
        treasurer={project.treasurer}
        tagsValue={project.tags.map((t) => t.tag.name).join(", ")}
      />
    </div>
  );
}
