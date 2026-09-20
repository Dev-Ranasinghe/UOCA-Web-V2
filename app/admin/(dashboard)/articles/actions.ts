"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { ContentStatus, ParticipantRole } from "@prisma/client";

export type ArticleActionState = { error?: string };

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const PARTICIPANT_ROLES = ["LEO", "LION", "GUEST", "VOLUNTEER", "PARTNER"] as const;

/** A participant's role comes from their own member record, not a per-article
 *  choice — falls back to LEO when their designation doesn't match a known role. */
async function resolveParticipantRoles(memberIds: string[]): Promise<Map<string, ParticipantRole>> {
  if (memberIds.length === 0) return new Map();
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, leoDesignation: true },
  });
  return new Map(
    members.map((m) => {
      const normalized = m.leoDesignation?.trim().toUpperCase();
      const role = (PARTICIPANT_ROLES as readonly string[]).includes(normalized ?? "")
        ? (normalized as ParticipantRole)
        : "LEO";
      return [m.id, role];
    }),
  );
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function readDate(formData: FormData, key: string) {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

function readJson(formData: FormData, key: string) {
  const v = str(formData, key);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
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

function readParticipantIds(formData: FormData) {
  const parsed = readJson(formData, "participantsJson") as string[] | null;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id) => typeof id === "string" && id.length > 0);
}

function readAuthorIds(formData: FormData) {
  const parsed = readJson(formData, "authorIdsJson") as string[] | null;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id) => typeof id === "string" && id.length > 0);
}

function readExternalLinks(formData: FormData) {
  const parsed = readJson(formData, "externalLinksJson") as { label: string; url: string }[] | null;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (l) => typeof l.label === "string" && l.label.trim() && typeof l.url === "string" && l.url.trim(),
  );
}

function readArticleInput(formData: FormData, mode: "project" | "blog") {
  const title = str(formData, "title");
  if (!title) throw new Error("Title is required.");

  const content = readJson(formData, "content");
  if (!content) throw new Error("Article content is required.");

  const projectId = mode === "project" ? str(formData, "projectId") : null;
  if (mode === "project" && !projectId) throw new Error("A project is required for project articles.");

  const statusRaw = formData.get("status");
  const status = (STATUSES.includes(statusRaw as ContentStatus) ? statusRaw : "DRAFT") as ContentStatus;

  const externalLinks = readExternalLinks(formData);

  return {
    title,
    subtitle: str(formData, "subtitle"),
    excerpt: str(formData, "excerpt"),
    content,
    projectId,
    categoryId: mode === "blog" ? str(formData, "categoryId") : null,
    status,
    featuredImageId: str(formData, "featuredImageId"),
    eventDate: readDate(formData, "eventDate"),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    locationId: str(formData, "locationId"),
    externalLinks: externalLinks.length > 0 ? externalLinks : null,
    metaTitle: str(formData, "metaTitle"),
    metaDescription: str(formData, "metaDescription"),
    slugOverride: str(formData, "slug") ? slugify(str(formData, "slug")!) : null,
    tagNames: str(formData, "tags"),
    authorIds: readAuthorIds(formData),
    participantIds: readParticipantIds(formData),
  };
}

export async function createArticle(
  mode: "project" | "blog",
  listPath: string,
  _prevState: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const admin = await requireAdmin();
  let articleId: string;
  try {
    const input = readArticleInput(formData, mode);
    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.title, async (candidate) => {
        const existing = await prisma.article.findUnique({ where: { slug: candidate } });
        return existing !== null;
      }));
    const tags = await upsertTags(input.tagNames);
    const roleByMemberId = await resolveParticipantRoles(input.participantIds);

    const article = await prisma.article.create({
      data: {
        slug,
        title: input.title,
        subtitle: input.subtitle,
        excerpt: input.excerpt,
        content: input.content,
        projectId: input.projectId,
        categoryId: input.categoryId,
        status: input.status,
        featuredImageId: input.featuredImageId,
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        locationId: input.locationId,
        externalLinks: input.externalLinks ?? undefined,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
        authors: {
          create: input.authorIds.map((memberId, index) => ({ memberId, sortOrder: index })),
        },
        participants: {
          create: input.participantIds.map((memberId) => ({
            memberId,
            role: roleByMemberId.get(memberId) ?? "LEO",
          })),
        },
      },
    });
    articleId = article.id;

    await logActivity({
      adminId: admin.id,
      action: "create",
      entityType: "article",
      entityId: article.id,
      entityLabel: article.title,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath(listPath);
  redirect(`${listPath}/${articleId}/edit`);
}

export async function updateArticle(
  id: string,
  mode: "project" | "blog",
  listPath: string,
  _prevState: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const admin = await requireAdmin();
  try {
    const input = readArticleInput(formData, mode);
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) throw new Error("Article not found.");

    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.title, async (candidate) => {
        const found = await prisma.article.findUnique({ where: { slug: candidate } });
        return found !== null && found.id !== id;
      }));
    const tags = await upsertTags(input.tagNames);
    const roleByMemberId = await resolveParticipantRoles(input.participantIds);

    const article = await prisma.$transaction(async (tx) => {
      await tx.articleTag.deleteMany({ where: { articleId: id } });
      await tx.articleAuthor.deleteMany({ where: { articleId: id } });
      await tx.articleParticipant.deleteMany({ where: { articleId: id } });
      return tx.article.update({
        where: { id },
        data: {
          slug,
          title: input.title,
          subtitle: input.subtitle,
          excerpt: input.excerpt,
          content: input.content,
          projectId: input.projectId,
          categoryId: input.categoryId,
          status: input.status,
          featuredImageId: input.featuredImageId,
          eventDate: input.eventDate,
          startTime: input.startTime,
          endTime: input.endTime,
          locationId: input.locationId,
          externalLinks: input.externalLinks ?? undefined,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          publishedAt:
            input.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
          tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
          authors: {
            create: input.authorIds.map((memberId, index) => ({ memberId, sortOrder: index })),
          },
          participants: {
            create: input.participantIds.map((memberId) => ({
              memberId,
              role: roleByMemberId.get(memberId) ?? "LEO",
            })),
          },
        },
      });
    });

    await logActivity({
      adminId: admin.id,
      action: "update",
      entityType: "article",
      entityId: article.id,
      entityLabel: article.title,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath(listPath);
  revalidatePath(`${listPath}/${id}/edit`);
  return {};
}

export async function deleteArticle(id: string, listPath: string) {
  const admin = await requireAdmin();
  const article = await prisma.article.delete({ where: { id } });
  await logActivity({
    adminId: admin.id,
    action: "delete",
    entityType: "article",
    entityId: id,
    entityLabel: article.title,
  });
  revalidatePath(listPath);
}
