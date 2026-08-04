import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions and route handlers.
 *
 * Session refresh writes new cookies. That is allowed in actions and route
 * handlers but throws inside a Server Component render, so the setAll call is
 * deliberately swallowed there — middleware has already refreshed the session
 * for that request.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render; middleware handles refresh.
        }
      },
    },
  });
}
