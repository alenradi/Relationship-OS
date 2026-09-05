import { NextResponse } from "next/server";

/** Public VAPID key only — needed if the client build didn't inline it. */
export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ key });
}
