import { NextResponse } from "next/server";

import { VAPID_PUBLIC_KEY } from "@/lib/vapid-public";

/** Public VAPID key only — needed if the client build didn't inline it. */
export async function GET() {
  return NextResponse.json({ key: VAPID_PUBLIC_KEY });
}
