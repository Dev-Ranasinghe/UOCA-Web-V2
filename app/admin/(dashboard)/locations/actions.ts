"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export type LocationActionState = { error?: string };

function readLocationInput(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Name is required.");
  }
  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  };
  const num = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim().length === 0) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    name: name.trim(),
    address: str("address"),
    city: str("city"),
    district: str("district"),
    province: str("province"),
    country: str("country"),
    mapUrl: str("mapUrl"),
    latitude: num("latitude"),
    longitude: num("longitude"),
  };
}

export async function createLocation(
  _prevState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const admin = await requireAdmin();
  try {
    const data = readLocationInput(formData);
    const location = await prisma.location.create({ data });
    await logActivity({
      adminId: admin.id,
      action: "create",
      entityType: "location",
      entityId: location.id,
      entityLabel: location.name,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/locations");
  return {};
}

export async function updateLocation(
  id: string,
  _prevState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const admin = await requireAdmin();
  try {
    const data = readLocationInput(formData);
    const location = await prisma.location.update({ where: { id }, data });
    await logActivity({
      adminId: admin.id,
      action: "update",
      entityType: "location",
      entityId: location.id,
      entityLabel: location.name,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  revalidatePath("/admin/locations");
  return {};
}

export async function deleteLocation(id: string) {
  const admin = await requireAdmin();
  const location = await prisma.location.delete({ where: { id } });
  await logActivity({
    adminId: admin.id,
    action: "delete",
    entityType: "location",
    entityId: id,
    entityLabel: location.name,
  });
  revalidatePath("/admin/locations");
}
