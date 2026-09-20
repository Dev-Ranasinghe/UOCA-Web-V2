import { requireAdmin } from "@/lib/auth/dal";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The real authorization boundary — proxy.ts only did an optimistic
  // cookie check. Every route under this layout is gated here.
  const admin = await requireAdmin();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar admin={admin} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-muted-foreground">
              UOCA Content Management
            </span>
          </header>
          <main className="flex-1 space-y-6 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}
