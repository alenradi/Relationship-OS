import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client. Bypasses RLS. Used by seed and by server-side push
 * (looking up every device subscription for a user).
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
