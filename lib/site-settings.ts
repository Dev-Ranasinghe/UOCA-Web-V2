import { prisma } from "@/lib/prisma";

/**
 * The only account that may switch maintenance mode on or off. The server action re-checks this on every call
 * (app/admin/(dashboard)/settings/actions.ts); the switch being disabled for everyone else is just a courtesy.
 */
export const MAINTENANCE_SWITCH_EMAIL = "999sasmith@gmail.com";

export const canToggleMaintenance = (email: string) => email.trim().toLowerCase() === MAINTENANCE_SWITCH_EMAIL;

/** Straight from the database. For the admin page, which must show the truth. */
export async function readMaintenanceMode(): Promise<boolean> {
  const row = await prisma.siteSettings.findUnique({ where: { id: "site" }, select: { maintenanceMode: true } });
  return row?.maintenanceMode ?? false;
}

// Every public request asks proxy.ts whether the site is in maintenance, and the database is a network hop away, so the
// answer is remembered for a few seconds. A flip therefore reaches visitors within TTL_MS. If the database can't be read,
// the last known answer stands (a site in maintenance stays in maintenance).
const TTL_MS = 5000;
let cached: { value: boolean; at: number } | null = null;

export async function getMaintenanceMode(): Promise<boolean> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let value = cached?.value ?? false;
  try {
    value = await readMaintenanceMode();
  } catch {
    // keep the last known value
  }
  cached = { value, at: Date.now() };
  return value;
}

export async function saveMaintenanceMode(enabled: boolean) {
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", maintenanceMode: enabled },
    update: { maintenanceMode: enabled },
  });
  cached = null;
}
