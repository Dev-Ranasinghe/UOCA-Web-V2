"use client";

import { usePathname } from "next/navigation";
import LynxWidget from "./LynxWidget";

/** Mounts LYNX on every public page. The admin dashboard is not a visitor-facing page, so it doesn't get it. */
export default function LynxRoot() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <LynxWidget />;
}
