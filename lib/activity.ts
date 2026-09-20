import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type ActivityAction =
  | "create"
  | "update"
  | "publish"
  | "unpublish"
  | "delete"
  | "archive";

export async function logActivity(params: {
  adminId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
