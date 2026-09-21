/** Pages that skip the site chrome and the intro animations: the admin dashboard and the maintenance page. */
export function isBareRoute(pathname: string | null | undefined): boolean {
  return !!pathname && (pathname.startsWith("/admin") || pathname === "/maintenance");
}
