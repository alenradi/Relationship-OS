import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client. Bypasses row level security entirely, so it is only ever
 * used by scripts/seed.ts — never by anything that serves a request.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
