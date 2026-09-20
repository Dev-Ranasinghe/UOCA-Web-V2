import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "../member-form";

export default async function NewMemberPage() {
  await requireAdmin();
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, url: true, fileName: true, mimeType: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New member</h1>
        <p className="text-sm text-muted-foreground">
          Add someone to the reusable People directory.
        </p>
      </div>
      <MemberForm media={media} />
    </div>
  );
}
