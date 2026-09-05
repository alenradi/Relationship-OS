import { renderAppIcon } from "@/lib/app-icon";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 512]);

/** Larger install icons for Android / “Add to Home Screen”. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await context.params;
  const size = Number(raw);

  if (!ALLOWED.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  const image = renderAppIcon(size);
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
