"use server";

import { prisma } from "@/lib/prisma";

export type LeoIdMemberOption = {
  id: string;
  fullName: string;
  displayName: string;
  clubRole: string | null;
  teamCategory: string | null;
  profileImageUrl: string | null;
};

/** Public, read-only member search for the Leo ID picker. No PII (email/phone) is returned. */
export async function searchLeoIdMembers(query: string): Promise<LeoIdMemberOption[]> {
  const trimmed = query.trim();

  const members = await prisma.member.findMany({
    where: {
      isActive: true,
      ...(trimmed
        ? {
            OR: [
              { fullName: { contains: trimmed, mode: "insensitive" } },
              { displayName: { contains: trimmed, mode: "insensitive" } },
              { clubRole: { contains: trimmed, mode: "insensitive" } },
              // Directors are shown as "Director", so searching that word should find them.
              ...("director".includes(trimmed.toLowerCase()) ? [{ teamCategory: "DIRECTOR" as const }] : []),
            ],
          }
        : {}),
    },
    orderBy: { fullName: "asc" },
    take: 40,
    select: {
      id: true,
      fullName: true,
      displayName: true,
      clubRole: true,
      teamCategory: true,
      profileImage: { select: { url: true } },
    },
  });

  return members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    displayName: m.displayName,
    clubRole: m.clubRole,
    teamCategory: m.teamCategory,
    profileImageUrl: m.profileImage?.url ?? null,
  }));
}

export type LeoIdProject = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  role: "Chairperson" | "Secretary" | "Treasurer";
  coverImageUrl: string | null;
};

export type LeoIdProfile = {
  id: string;
  fullName: string;
  displayName: string;
  profileImageUrl: string | null;
  clubRole: string | null;
  leoDesignation: string | null;
  bio: string | null;
  city: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  birthDate: string | null;
  mylciId: string | null;
  isNewLeo: boolean;
  leoExperience: string | null;
  teamCategory: string | null;
  socialLinks: { linkedin?: string; instagram?: string; whatsapp?: string } | null;
  projects: LeoIdProject[];
};

/** Public profile lookup for the Leo ID viewer. Excludes email/phone. */
export async function getLeoIdProfile(memberId: string): Promise<LeoIdProfile | null> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, isActive: true },
    include: {
      profileImage: true,
      chairedProjects: {
        where: { status: "PUBLISHED" },
        select: { id: true, slug: true, name: true, shortDescription: true, coverImage: { select: { url: true } } },
      },
      secretaryProjects: {
        where: { status: "PUBLISHED" },
        select: { id: true, slug: true, name: true, shortDescription: true, coverImage: { select: { url: true } } },
      },
      treasurerProjects: {
        where: { status: "PUBLISHED" },
        select: { id: true, slug: true, name: true, shortDescription: true, coverImage: { select: { url: true } } },
      },
    },
  });
  if (!member) return null;

  const projects: LeoIdProject[] = [
    ...member.chairedProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      role: "Chairperson" as const,
      coverImageUrl: p.coverImage?.url ?? null,
    })),
    ...member.secretaryProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      role: "Secretary" as const,
      coverImageUrl: p.coverImage?.url ?? null,
    })),
    ...member.treasurerProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      role: "Treasurer" as const,
      coverImageUrl: p.coverImage?.url ?? null,
    })),
  ];

  return {
    id: member.id,
    fullName: member.fullName,
    displayName: member.displayName,
    profileImageUrl: member.profileImage?.url ?? null,
    clubRole: member.clubRole,
    leoDesignation: member.leoDesignation,
    bio: member.bio,
    city: member.city,
    gender: member.gender,
    birthDate: member.birthDate ? member.birthDate.toISOString() : null,
    mylciId: member.mylciId,
    isNewLeo: member.isNewLeo,
    leoExperience: member.leoExperience,
    teamCategory: member.teamCategory,
    socialLinks: member.socialLinks as LeoIdProfile["socialLinks"],
    projects,
  };
}
