"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FilePlus2, FolderPlus, ImagePlus, Newspaper, PanelLeft, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

const CREATE_ITEMS = [
  { label: "Project", href: "/admin/projects/new", icon: FolderPlus },
  { label: "Project article", href: "/admin/project-articles/new", icon: FilePlus2 },
  { label: "Blog article", href: "/admin/articles/new", icon: Newspaper },
  { label: "Member", href: "/admin/members/new", icon: UserPlus },
  { label: "Media", href: "/admin/media", icon: ImagePlus },
];

/** The mustard top bar: sidebar toggle, wordmark, "New" menu and a link out to the public site. */
export function AdminHeader() {
  const { toggleSidebar, setOpen } = useSidebar();

  // Tablets get the icon-only sidebar by default so the tables keep their width; the toggle still expands it.
  React.useEffect(() => {
    if (window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches) setOpen(false);
  }, [setOpen]);

  return (
    <header className="sticky top-0 z-30 w-full border-b-2 border-(color:--nb-ink) bg-(--nb-yellow) shadow-[0_3px_0_rgb(22_22_22/0.12)]">
      <div className="flex h-(--nb-header-h) items-center gap-3 px-4 md:px-6">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
        >
          <PanelLeft />
        </Button>

        <Link
          href="/admin"
          data-nb-plain
          className="text-[1.3rem] leading-[0.95] font-medium tracking-[-0.02em] text-(color:--nb-ink) md:text-[1.45rem]"
          aria-label="UOCA admin, dashboard"
        >
          UOCA
          <br />
          .ADMIN
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" aria-label="Create new">
                  <Plus />
                  <span className="hidden sm:inline">New</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" sideOffset={10} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-bold text-(color:--nb-muted)">Create a new…</DropdownMenuLabel>
                {CREATE_ITEMS.map((item) => (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    <item.icon />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            nativeButton={false}
            aria-label="View the public site (opens in a new tab)"
            render={
              <a href="/" target="_blank" rel="noreferrer">
                <span className="hidden sm:inline">View site</span>
                <ArrowUpRight />
              </a>
            }
          />
        </div>
      </div>
    </header>
  );
}
