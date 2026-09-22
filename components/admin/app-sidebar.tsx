"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Newspaper,
  Tags,
  Users,
  MapPin,
  Image as ImageIcon,
  ShieldCheck,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserMenu } from "./user-menu";
import type { Admin } from "@prisma/client";

// The yellow "you are here" pill. One element shared by every item (layoutId), so it slides to the new item on navigation.
function ActivePill() {
  return (
    <motion.span
      layoutId="admin-nav-active"
      aria-hidden="true"
      className="absolute -inset-0.5 -z-10 rounded-[10px] border-2 border-(color:--nb-ink) bg-(--nb-yellow) shadow-[2px_2px_0_var(--nb-ink)]"
      transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.8 }}
    />
  );
}

const NAV_ITEMS = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Projects", url: "/admin/projects", icon: FolderKanban },
  { title: "Project Articles", url: "/admin/project-articles", icon: FileText },
  { title: "Blog / Articles", url: "/admin/articles", icon: Newspaper },
  { title: "Categories", url: "/admin/categories", icon: Tags },
  { title: "People / Members", url: "/admin/members", icon: Users },
  { title: "Locations", url: "/admin/locations", icon: MapPin },
  { title: "Media", url: "/admin/media", icon: ImageIcon },
];

export function AppSidebar({ admin }: { admin: Admin }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // On phones the sidebar is a drawer: close it once a link has taken you somewhere.
  React.useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <MotionConfig reducedMotion="user">
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-(color:--nb-ink) bg-(--nb-yellow) text-sm font-extrabold shadow-[2px_2px_0_var(--nb-ink)]">
              U
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-bold">UOCA Admin</span>
              <span className="text-xs text-(color:--nb-muted)">Content studio</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.url === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={
                          <Link href={item.url}>
                            {isActive ? <ActivePill /> : null}
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {admin.role === "SUPER_ADMIN" ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname.startsWith("/admin/admins")}
                      tooltip="Admin Users"
                      render={
                        <Link href="/admin/admins">
                          {pathname.startsWith("/admin/admins") ? <ActivePill /> : null}
                          <ShieldCheck />
                          <span>Admin Users</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/admin/settings")}
                    tooltip="Settings"
                    render={
                      <Link href="/admin/settings">
                        {pathname.startsWith("/admin/settings") ? <ActivePill /> : null}
                        <Settings />
                        <span>Settings</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <UserMenu admin={admin} />
        </SidebarFooter>
      </Sidebar>
    </MotionConfig>
  );
}
