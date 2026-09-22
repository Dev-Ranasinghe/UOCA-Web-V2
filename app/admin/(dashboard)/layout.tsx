import { requireAdmin } from "@/lib/auth/dal";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
      {/* Two rows: the full-width header, then the sidebar beside the page (on phones the sidebar is a drawer). */}
      <SidebarProvider className="flex-col">
        <AdminHeader />
        <div className="flex w-full min-w-0 flex-1">
          <AppSidebar admin={admin} />
          <SidebarInset className="min-w-0 bg-transparent">
            <div data-admin-main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 pt-6 pb-16 sm:px-6 md:pt-8 lg:px-8">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <Toaster theme="light" position="bottom-right" />
    </TooltipProvider>
  );
}
