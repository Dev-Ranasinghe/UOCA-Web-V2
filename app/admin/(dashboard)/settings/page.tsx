import { requireAdmin } from "@/lib/auth/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { canToggleMaintenance, MAINTENANCE_SWITCH_EMAIL, readMaintenanceMode } from "@/lib/site-settings";
import { MaintenanceCard } from "./maintenance-card";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const maintenance = await readMaintenanceMode().catch(() => false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account details and site controls.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{admin.displayName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{admin.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant={admin.role === "SUPER_ADMIN" ? "default" : "secondary"}>
              {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <MaintenanceCard
        initial={maintenance}
        canEdit={admin.role === "SUPER_ADMIN" && canToggleMaintenance(admin.email)}
        ownerEmail={MAINTENANCE_SWITCH_EMAIL}
      />
    </div>
  );
}
