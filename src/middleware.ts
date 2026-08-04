import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up", "/auth/callback"];

/**
 * Refreshes the Supabase session on every request and keeps unauthenticated
 * visitors out. Deliberately does not look at couple membership or onboarding
 * state — that needs a database read, and the app layout is a better place for
 * it than a middleware that runs on every asset request.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublic) {
    const redirectTo = new URL("/sign-in", request.url);
    if (pathname !== "/") {
      redirectTo.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectTo);
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static files. Keeping images and
     * fonts out matters: each matched request costs an auth round trip.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
