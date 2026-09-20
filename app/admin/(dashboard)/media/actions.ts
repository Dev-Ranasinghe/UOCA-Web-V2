"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export async function recordMedia(input: {
  storagePath: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
}) {
  const admin = await requireAdmin();

  const media = await prisma.media.create({
    data: {
      storagePath: input.storagePath,
      url: input.url,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      altText: input.altText,
      uploadedById: admin.id,
    },
  });

  await logActivity({
    adminId: admin.id,
    action: "create",
    entityType: "media",
    entityId: media.id,
    entityLabel: media.fileName,
  });

  revalidatePath("/admin/media");
  return media;
}

export async function deleteMedia(id: string) {
  const admin = await requireAdmin();

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;

  // Best-effort: remove the underlying file too, not just the DB row.
  const supabase = createAdminClient();
  await supabase.storage.from("media").remove([media.storagePath]);

  await prisma.media.delete({ where: { id } });

  await logActivity({
    adminId: admin.id,
    action: "delete",
    entityType: "media",
    entityId: id,
    entityLabel: media.fileName,
  });

  revalidatePath("/admin/media");
}
