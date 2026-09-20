"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Gender, RelationshipStatus } from "@prisma/client";

export type MemberActionState = { error?: string };

const TEAM_CATEGORIES = ["EXCO", "HEAD", "DIRECTOR"] as const;
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
const RELATIONSHIP_STATUSES = ["SINGLE", "TAKEN", "LOOKING", "NOT_INTERESTED"] as const;

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function readDate(formData: FormData, key: string) {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

function readMemberInput(formData: FormData) {
  const fullName = str(formData, "fullName");
  if (!fullName) throw new Error("Full name is required.");
  const displayName = str(formData, "displayName") ?? fullName;

  const isTeamMember = formData.get("isTeamMember") === "on";
  const teamCategoryRaw = formData.get("teamCategory");
  const teamCategory =
    isTeamMember && TEAM_CATEGORIES.includes(teamCategoryRaw as (typeof TEAM_CATEGORIES)[number])
      ? (teamCategoryRaw as (typeof TEAM_CATEGORIES)[number])
      : null;

  const genderRaw = formData.get("gender");
  const gender = GENDERS.includes(genderRaw as (typeof GENDERS)[number])
    ? (genderRaw as Gender)
    : null;

  const relationshipStatusRaw = formData.get("relationshipStatus");
  const relationshipStatus = RELATIONSHIP_STATUSES.includes(
    relationshipStatusRaw as (typeof RELATIONSHIP_STATUSES)[number],
  )
    ? (relationshipStatusRaw as RelationshipStatus)
    : null;

  const isNewLeo = formData.get("isNewLeo") === "on";

  const teamSortOrderRaw = str(formData, "teamSortOrder");
  const teamSortOrder = teamSortOrderRaw ? Number.parseInt(teamSortOrderRaw, 10) || 0 : 0;

  const socialLinks = {
    linkedin: str(formData, "linkedin") ?? undefined,
    instagram: str(formData, "instagram") ?? undefined,
    whatsapp: str(formData, "whatsapp") ?? undefined,
  };
  const hasAnySocial = Object.values(socialLinks).some(Boolean);

  return {
    fullName,
    displayName,
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    leoDesignation: str(formData, "leoDesignation"),
    clubRole: str(formData, "clubRole"),
    bio: str(formData, "bio"),
    profileImageId: str(formData, "profileImageId"),
    isActive: formData.get("isActive") === "on",
    isTeamMember,
    teamCategory,
    teamSortOrder,
    isAuthor: formData.get("isAuthor") === "on",
    socialLinks: hasAnySocial ? socialLinks : null,
    slugOverride: str(formData, "slug") ? slugify(str(formData, "slug")!) : null,
    mylciId: str(formData, "mylciId"),
    birthDate: readDate(formData, "birthDate"),
    gender,
    relationshipStatus,
    city: str(formData, "city"),
    isNewLeo,
    leoExperience: isNewLeo ? null : str(formData, "leoExperience"),
  };
}

export async function createMember(
  _prevState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const admin = await requireAdmin();
  let memberId: string;
  try {
    const input = readMemberInput(formData);
    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.fullName, async (candidate) => {
        const existing = await prisma.member.findUnique({ where: { slug: candidate } });
        return existing !== null;
      }));

    const member = await prisma.member.create({
      data: {
        slug,
        fullName: input.fullName,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone,
        leoDesignation: input.leoDesignation,
        clubRole: input.clubRole,
        bio: input.bio,
        profileImageId: input.profileImageId,
        isActive: input.isActive,
        isTeamMember: input.isTeamMember,
        teamCategory: input.teamCategory,
        teamSortOrder: input.teamSortOrder,
        isAuthor: input.isAuthor,
        socialLinks: input.socialLinks ?? undefined,
        mylciId: input.mylciId,
        birthDate: input.birthDate,
        gender: input.gender,
        relationshipStatus: input.relationshipStatus,
        city: input.city,
        isNewLeo: input.isNewLeo,
        leoExperience: input.leoExperience,
      },
    });
    memberId = member.id;
    await logActivity({
      adminId: admin.id,
      action: "create",
      entityType: "member",
      entityId: member.id,
      entityLabel: member.fullName,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/members");
  redirect(`/admin/members/${memberId}/edit`);
}

export async function updateMember(
  id: string,
  _prevState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const admin = await requireAdmin();
  try {
    const input = readMemberInput(formData);
    const slug =
      input.slugOverride ??
      (await uniqueSlug(input.fullName, async (candidate) => {
        const existing = await prisma.member.findUnique({ where: { slug: candidate } });
        return existing !== null && existing.id !== id;
      }));

    const member = await prisma.member.update({
      where: { id },
      data: {
        slug,
        fullName: input.fullName,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone,
        leoDesignation: input.leoDesignation,
        clubRole: input.clubRole,
        bio: input.bio,
        profileImageId: input.profileImageId,
        isActive: input.isActive,
        isTeamMember: input.isTeamMember,
        teamCategory: input.teamCategory,
        teamSortOrder: input.teamSortOrder,
        isAuthor: input.isAuthor,
        socialLinks: input.socialLinks ?? undefined,
        mylciId: input.mylciId,
        birthDate: input.birthDate,
        gender: input.gender,
        relationshipStatus: input.relationshipStatus,
        city: input.city,
        isNewLeo: input.isNewLeo,
        leoExperience: input.leoExperience,
      },
    });
    await logActivity({
      adminId: admin.id,
      action: "update",
      entityType: "member",
      entityId: member.id,
      entityLabel: member.fullName,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}/edit`);
  return {};
}

export async function deleteMember(id: string) {
  const admin = await requireAdmin();
  const member = await prisma.member.delete({ where: { id } });
  await logActivity({
    adminId: admin.id,
    action: "delete",
    entityType: "member",
    entityId: id,
    entityLabel: member.fullName,
  });
  revalidatePath("/admin/members");
}

export async function searchMembers(query: string, authorsOnly = false) {
  await requireAdmin();
  if (!query.trim()) {
    return prisma.member.findMany({
      where: { isActive: true, ...(authorsOnly ? { isAuthor: true } : {}) },
      orderBy: { fullName: "asc" },
      take: 20,
      select: { id: true, fullName: true, displayName: true, profileImage: { select: { url: true } } },
    });
  }
  return prisma.member.findMany({
    where: {
      isActive: true,
      ...(authorsOnly ? { isAuthor: true } : {}),
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: 20,
    select: { id: true, fullName: true, displayName: true, profileImage: { select: { url: true } } },
  });
}
