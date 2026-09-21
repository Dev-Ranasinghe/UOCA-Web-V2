"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { logActivity } from "@/lib/activity";
import { canToggleMaintenance, MAINTENANCE_SWITCH_EMAIL, saveMaintenanceMode } from "@/lib/site-settings";

export type MaintenanceResult = { ok: true; enabled: boolean } | { ok: false; error: string };

/** Turns maintenance mode on or off. Only the one account in MAINTENANCE_SWITCH_EMAIL may do this, checked here on the server. */
export async function setMaintenanceMode(enabled: boolean): Promise<MaintenanceResult> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN" || !canToggleMaintenance(admin.email)) {
    return { ok: false, error: `Only ${MAINTENANCE_SWITCH_EMAIL} can switch maintenance mode.` };
  }
  if (typeof enabled !== "boolean") return { ok: false, error: "Invalid request." };

  try {
    await saveMaintenanceMode(enabled);
    await logActivity({
      adminId: admin.id,
      action: "update",
      entityType: "settings",
      entityId: "site",
      entityLabel: enabled ? "Maintenance mode turned on" : "Maintenance mode turned off",
    });
  } catch {
    return { ok: false, error: "Could not save the change. Try again." };
  }
  revalidatePath("/admin/settings");
  return { ok: true, enabled };
}
