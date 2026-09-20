import { requireSuperAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminUsersPage() {
  // Super Admin only — viewing and managing who else has dashboard access.
  await requireSuperAdmin();

  const admins = await prisma.admin.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Users</h1>
        <p className="text-sm text-muted-foreground">
          Everyone with access to this dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {admins.length} admin{admins.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar className="size-8">
                  <AvatarImage src={a.avatarUrl ?? undefined} alt={a.displayName} />
                  <AvatarFallback>{initials(a.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.displayName}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
                <Badge variant={a.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                  {a.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                </Badge>
                {!a.isActive ? <Badge variant="outline">Inactive</Badge> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Adding new admins from this screen lands in the next phase of the CMS
            build.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
