"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * One browser client per tab. Reused so realtime subscriptions all share a
 * single websocket instead of opening one per component.
 */
export function createSupabaseBrowserClient() {
  cached ??= createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
  return cached;
}
