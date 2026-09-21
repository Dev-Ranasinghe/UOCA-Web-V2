import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getMaintenanceMode } from "@/lib/site-settings";

/**
 * Optimistic auth check only — refreshes the Supabase session cookie and
 * redirects unauthenticated requests away from /admin/*. This never queries
 * the Admin table (that's the real authorization boundary, in
 * lib/auth/dal.ts), it only checks whether *a* Supabase session exists.
 */
async function adminProxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  // Fail closed: if Supabase is unreachable or misconfigured, treat the
  // request as unauthenticated rather than crashing every /admin/* request.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // fall through with user = null
  }

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Bounce an already-signed-in visitor away from the login page — but not
  // when they were just sent here as an unauthorized (non-admin) Supabase
  // user, or this would loop forever against the DAL's own redirect back
  // to this same URL.
  if (user && isLoginPage && !request.nextUrl.searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Maintenance mode (switched in /admin/settings). While it is on, every public page redirects to /maintenance. Left alone:
 * the admin dashboard, /auth, /api (the maintenance page polls it), Next's own files and anything with a file extension
 * (images, fonts, icons). It applies to everyone, signed-in admins included, so what you see while testing is what visitors
 * see; switch it off in /admin/settings to look at the real site.
 */
async function maintenanceProxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const maintenance = await getMaintenanceMode();

  if (pathname === "/maintenance") {
    // Nothing to wait for: send them home. `?preview` lets the admin panel show the page while the site is live.
    if (!maintenance && !searchParams.has("preview")) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!maintenance) return NextResponse.next();

  const response = NextResponse.redirect(new URL("/maintenance", request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/admin") ? adminProxy(request) : maintenanceProxy(request);
}

export const config = {
  matcher: ["/admin/:path*", "/((?!api|auth|admin|_next|.*\\..*).*)"],
};
