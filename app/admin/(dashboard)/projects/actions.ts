"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { ContentStatus } from "@prisma/client";

export type ProjectActionState = { error?: string };

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function readDate(formData: FormData, key: string) {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

async function upsertTags(tagsInput: string | null) {
  if (!tagsInput) return [];
  const names = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const tags = [];
  for (const name of names) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tags.push(tag);
  }
  return tags;
}

function readProjectInput(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("Project name is required.");
  const shortDescription = str(formData, "shortDescription");
  if (!shortDescription) throw new Error("Short description is required.");

  const statusRaw = formData.get("status");
  const status = (STATUSES.includes(statusRaw as ContentStatus)
    ? statusRaw
    : "DRAFT") as ContentStatus;

  return {
    name,
    shortDescription,
    status,
    coverImageId: str(formData, "coverImageId"),
    startDate: readDate(formData, "startDate"),
    endDate: readDate(formData, "endDate"),
    chairpersonId: str(formData, "chairpersonId"),
    secretaryId: str(formData, "secretaryId"),
    treasurerId: str(formData, "treasurerId"),
    metaTitle: str(formData, "metaTitle"),
    metaDescription: str(formData, "metaDescription"),
    slugOverride: str(formData, "slug") ? slugify(str(formData, "slug")!) : null,
    tagNames: str(formData, "tags"),
  };
}

export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const admin = await requireAdmin();
  let projectId: string;
  try {
    const input = readProjectInput(formData);
    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.name, async (candidate) => {
        const existing = await prisma.project.findUnique({ where: { slug: candidate } });
        return existing !== null;
      }));
    const tags = await upsertTags(input.tagNames);

    const project = await prisma.project.create({
      data: {
        slug,
        name: input.name,
        shortDescription: input.shortDescription,
        status: input.status,
        coverImageId: input.coverImageId,
        startDate: input.startDate,
        endDate: input.endDate,
        chairpersonId: input.chairpersonId,
        secretaryId: input.secretaryId,
        treasurerId: input.treasurerId,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
      },
    });
    projectId = project.id;

    await logActivity({
      adminId: admin.id,
      action: "create",
      entityType: "project",
      entityId: project.id,
      entityLabel: project.name,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${projectId}/edit`);
}

export async function updateProject(
  id: string,
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const admin = await requireAdmin();
  try {
    const input = readProjectInput(formData);
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new Error("Project not found.");

    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.name, async (candidate) => {
        const found = await prisma.project.findUnique({ where: { slug: candidate } });
        return found !== null && found.id !== id;
      }));
    const tags = await upsertTags(input.tagNames);

    const project = await prisma.$transaction(async (tx) => {
      await tx.projectTag.deleteMany({ where: { projectId: id } });
      return tx.project.update({
        where: { id },
        data: {
          slug,
          name: input.name,
          shortDescription: input.shortDescription,
          status: input.status,
          coverImageId: input.coverImageId,
          startDate: input.startDate,
          endDate: input.endDate,
          chairpersonId: input.chairpersonId,
          secretaryId: input.secretaryId,
          treasurerId: input.treasurerId,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          publishedAt:
            input.status === "PUBLISHED" && !existing.publishedAt
              ? new Date()
              : existing.publishedAt,
          tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
        },
      });
    });

    await logActivity({
      adminId: admin.id,
      action: "update",
      entityType: "project",
      entityId: project.id,
      entityLabel: project.name,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}/edit`);
  return {};
}

export async function deleteProject(id: string) {
  const admin = await requireAdmin();
  const project = await prisma.project.delete({ where: { id } });
  await logActivity({
    adminId: admin.id,
    action: "delete",
    entityType: "project",
    entityId: id,
    entityLabel: project.name,
  });
  revalidatePath("/admin/projects");
}
