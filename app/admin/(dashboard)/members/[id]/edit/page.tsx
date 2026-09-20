import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "../../member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [member, media] = await Promise.all([
    prisma.member.findUnique({ where: { id }, include: { profileImage: true } }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, url: true, fileName: true, mimeType: true },
    }),
  ]);

  if (!member) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{member.fullName}</h1>
        <p className="text-sm text-muted-foreground">Edit this member&apos;s details.</p>
      </div>
      <MemberForm member={member} profileImage={member.profileImage} media={media} />
    </div>
  );
}
