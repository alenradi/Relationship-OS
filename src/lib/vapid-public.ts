/**
 * Public VAPID key for Web Push. Safe to ship in the client — the private
 * key stays in VAPID_PRIVATE_KEY on the server.
 *
 * Env wins when present so a rotate doesn't need a code change. The fallback
 * exists because NEXT_PUBLIC_ values are easy to miss on a Vercel production
 * deploy, which made Settings say notifications weren't configured.
 */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLVVFsKQG1hVbQ06eeDYNrG09J-qUgdbPfD-JQGQE-wBuzD49QHsiX8w04e9OAqlNfnO53JfLM4zZ0qX3c76HkI";
