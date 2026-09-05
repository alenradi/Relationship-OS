import webpush from "web-push";

import { copy } from "@/lib/copy";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid-public";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function vapidConfigured() {
  return Boolean(VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PUBLIC_KEY || !privateKey) return false;
  webpush.setVapidDetails("mailto:alen.radi@gmail.com", VAPID_PUBLIC_KEY, privateKey);
  return true;
}

/** Send a notification to every device a user has subscribed. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!vapidConfigured() || !configure()) return;

  const admin = createSupabaseAdminClient();
  const { data: rows } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const row of rows ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? "/",
        }),
      );
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }
}

export async function notifyPartner(
  partnerId: string | null | undefined,
  payload: PushPayload,
) {
  if (!partnerId) return;
  await sendPushToUser(partnerId, payload);
}

export function pushCopy() {
  return copy.push;
}
