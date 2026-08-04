"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Listens to the couple's event pulse and refreshes server data when the other
 * side does something.
 *
 * It subscribes to couple_events rather than to the content tables because an
 * unrevealed reflection row is invisible to the partner under RLS, so a
 * subscription there would never fire for them. couple_events carries no
 * content, only "something of kind X happened".
 */
export function RealtimeRefresher({ coupleId }: { coupleId: string }) {
  const router = useRouter();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`couple:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "couple_events",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          // Bursts are common (a submit logs two events), so coalesce them.
          if (pending.current) clearTimeout(pending.current);
          pending.current = setTimeout(() => router.refresh(), 400);
        },
      )
      .subscribe();

    return () => {
      if (pending.current) clearTimeout(pending.current);
      void supabase.removeChannel(channel);
    };
  }, [coupleId, router]);

  return null;
}
