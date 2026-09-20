import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth check only — refreshes the Supabase session cookie and
 * redirects unauthenticated requests away from /admin/*. This never queries
 * the Admin table (that's the real authorization boundary, in
 * lib/auth/dal.ts), it only checks whether *a* Supabase session exists.
 */
export async function proxy(request: NextRequest) {
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

export const config = {
  matcher: ["/admin/:path*"],
};
