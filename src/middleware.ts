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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Missing env on Vercel would otherwise crash the Edge middleware with a
  // MIDDLEWARE_INVOCATION_FAILED 500. Fail soft and send people to sign-in.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in this deployment.",
    );
    const { pathname } = request.nextUrl;
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    });

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
  } catch (error) {
    console.error("Supabase middleware failed:", error);
    const { pathname } = request.nextUrl;
    if (
      pathname === "/sign-in" ||
      pathname === "/sign-up" ||
      pathname.startsWith("/auth/")
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, generated icons/manifest, and static
     * files. Icons must stay public — otherwise Add to Home Screen gets a
     * blank tile (auth redirect instead of a PNG).
     */
    "/((?!_next/static|_next/image|favicon.ico|icon$|apple-icon$|pwa-icon/|sw\\.js$|manifest\\.webmanifest$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
