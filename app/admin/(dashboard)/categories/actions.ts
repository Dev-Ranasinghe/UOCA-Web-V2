"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { slugify, uniqueSlug } from "@/lib/slug";

export type CategoryActionState = { error?: string };

const KINDS = ["PROJECT", "BLOG", "GENERAL"] as const;

function readCategoryInput(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Name is required.");
  }
  const kindRaw = formData.get("kind");
  const kind = KINDS.includes(kindRaw as (typeof KINDS)[number])
    ? (kindRaw as (typeof KINDS)[number])
    : "GENERAL";
  const description = formData.get("description");
  const imageId = formData.get("imageId");
  const slugOverride = formData.get("slug");

  return {
    name: name.trim(),
    kind,
    description:
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : null,
    imageId: typeof imageId === "string" && imageId.length > 0 ? imageId : null,
    slugOverride:
      typeof slugOverride === "string" && slugOverride.trim().length > 0
        ? slugify(slugOverride)
        : null,
  };
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const admin = await requireAdmin();
  try {
    const input = readCategoryInput(formData);
    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.name, async (candidate) => {
        const existing = await prisma.category.findUnique({ where: { slug: candidate } });
        return existing !== null;
      }));

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug,
        kind: input.kind,
        description: input.description,
        imageId: input.imageId,
      },
    });
    await logActivity({
      adminId: admin.id,
      action: "create",
      entityType: "category",
      entityId: category.id,
      entityLabel: category.name,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/categories");
  return {};
}

export async function updateCategory(
  id: string,
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const admin = await requireAdmin();
  try {
    const input = readCategoryInput(formData);
    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.name, async (candidate) => {
        const existing = await prisma.category.findUnique({ where: { slug: candidate } });
        return existing !== null && existing.id !== id;
      }));

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        kind: input.kind,
        description: input.description,
        imageId: input.imageId,
      },
    });
    await logActivity({
      adminId: admin.id,
      action: "update",
      entityType: "category",
      entityId: category.id,
      entityLabel: category.name,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/categories");
  return {};
}

export async function deleteCategory(id: string) {
  const admin = await requireAdmin();
  const category = await prisma.category.delete({ where: { id } });
  await logActivity({
    adminId: admin.id,
    action: "delete",
    entityType: "category",
    entityId: id,
    entityLabel: category.name,
  });
  revalidatePath("/admin/categories");
}
