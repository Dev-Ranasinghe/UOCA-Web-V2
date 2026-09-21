"use client";

import { usePathname } from "next/navigation";
import LynxWidget from "./LynxWidget";
import { isBareRoute } from "@/lib/bare-routes";

/** Mounts LYNX on every public page. The admin dashboard is not a visitor-facing page, so it doesn't get it. */
export default function LynxRoot() {
  const pathname = usePathname();
  if (isBareRoute(pathname)) return null;
  return <LynxWidget />;
}
