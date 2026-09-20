import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  await requireAdmin();

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, url: true, fileName: true, mimeType: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-sm text-muted-foreground">
          Set up a new Leo Club project. You can add articles to it once it&apos;s created.
        </p>
      </div>
      <ProjectForm media={media} tagsValue="" />
    </div>
  );
}
