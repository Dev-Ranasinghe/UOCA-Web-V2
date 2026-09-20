import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Admin } from "@prisma/client";

/**
 * The real authorization boundary (proxy.ts only does an optimistic
 * session-cookie check). Signing in via Supabase proves identity; this
 * confirms the signed-in person actually has an active row in the Admin
 * table before granting dashboard access.
 *
 * Wrapped in React's cache() so multiple calls within one request (layout +
 * page + nested components) share a single DB round trip.
 */
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await createClient();

  // Fail closed on identity check: if Supabase is unreachable, treat this as
  // "not signed in" rather than throwing (a genuine DB problem below is
  // still allowed to surface as a real error — only the auth check itself
  // is soft-failed, matching proxy.ts's behavior).
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return null;
  }

  if (!user) return null;

  const admin = await prisma.admin.findUnique({
    where: { authUserId: user.id },
  });

  if (!admin || !admin.isActive) return null;

  return admin;
});

/**
 * Call at the top of every admin Server Component / Server Action.
 *
 * A signed-in Supabase user with no active Admin row is a real, distinct
 * case from "not logged in" (proxy.ts already redirects that one) — send
 * them to login with a message rather than silently looping them back
 * through a page they're technically already authenticated for.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?error=unauthorized");
  return admin;
}

/** Call in any Server Action or page restricted to Super Admins. */
export async function requireSuperAdmin(): Promise<Admin> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: this action requires Super Admin access.");
  }
  return admin;
}
